
import { Image } from "@/src/components/ui/Image";
import { Input } from "@/src/components/ui/Input";
import { useAuth } from "@/src/context/auth";
import { supabase } from "@/src/lib/supabase";
import { Stack, router } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Applicant = {
  id: string;
  full_name: string | null;
  email: string | null;
  identifier: string | null;
  role: string;
  approval_status: string;
  study_program_id?: string | null;
  created_at?: string;
};

const statuses = [
  "pending",
  "approved",
  "rejected",
] as const;

type Status = (typeof statuses)[number];

const statusLabel: Record<Status, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function AdminScreen() {
  const { loading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [rows, setRows] = useState<Applicant[]>([]);
  const [filter, setFilter] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  // Verifikasi akses administrator
  const verifyAdmin = useCallback(async () => {
    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const userId = sessionData.session?.user.id;

      if (!userId) {
        setIsAdmin(false);
        router.replace("/admin/login");
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const ok =
        String(profile?.role ?? "")
          .trim()
          .toLowerCase() === "admin";

      setIsAdmin(ok);

      if (!ok) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      }
    } catch (error) {
      console.error("ADMIN VERIFICATION ERROR:", error);

      setIsAdmin(false);
      router.replace("/admin/login");
    } finally {
      setChecking(false);
    }
  }, []);

  // Memuat data pengguna
  const load = useCallback(async () => {
    if (!isAdmin) return;

    setRefreshing(true);
    setLoadError("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,email,identifier,role,approval_status,study_program_id,created_at"
        )
        .eq("approval_status", filter)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      const applicants = (data ?? []).filter(
        (item) =>
          String(item.role).toLowerCase() !== "admin"
      );

      setRows(applicants as Applicant[]);
    } catch (error) {
      console.error("LOAD APPLICANTS ERROR:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Gagal memuat data pengguna."
      );
    } finally {
      setRefreshing(false);
    }
  }, [filter, isAdmin]);

  // Inisialisasi admin
  useEffect(() => {
    if (!loading) {
      verifyAdmin();
    }
  }, [loading, verifyAdmin]);

  // Realtime dashboard
  useEffect(() => {
    if (!isAdmin) return;

    load();

    const channel = supabase
      .channel("admin-profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          load();
        }
      )
      .subscribe((status) => {
        console.log("ADMIN REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, load]);

  // Mengubah status pengguna secara langsung
  const changeStatus = async (
    item: Applicant,
    status: "approved" | "rejected"
  ) => {
    if (actionLoading) return;

    setActionLoading(item.id);
    setLoadError("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: status,
        })
        .eq("id", item.id);

      if (error) throw error;

      // Perbarui daftar setelah berhasil
      await load();
    } catch (error) {
      console.error("CHANGE STATUS ERROR:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status pengguna."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Pencarian pengguna
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((item) => {
      const searchable = [
        item.full_name,
        item.identifier,
        item.email,
        item.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [rows, search]);

  if (loading || checking) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator
          size="large"
          color="#208AEF"
        />

        <Text className="mt-4 font-poppins text-sm text-muted">
          Memeriksa akses administrator...
        </Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Stack.Screen
        options={{
          title: "Admin Dashboard",
          headerShown: false,
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 20,
          paddingBottom: 35,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={load}
            tintColor="#208AEF"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="mb-7 flex-row items-center">
              <Image
                className="h-12 w-12 rounded-lg"
                source={require("@/assets/images/logo_uib.webp")}
                contentFit="contain"
              />

              <View className="ml-3 flex-1">
                <Text className="font-poppins-bold text-xl text-primary">
                  UIBScholar
                </Text>

                <Text className="font-poppins text-xs text-muted">
                  Administrator Portal
                </Text>
              </View>

              <View className="rounded-full bg-primary/10 px-3 py-2">
                <Text className="font-poppins-medium text-[10px] text-primary">
                  ADMIN
                </Text>
              </View>
            </View>

            {/* Judul */}
            <Text className="font-poppins-bold text-2xl text-black">
              Admin Dashboard
            </Text>

            <Text className="mb-6 mt-1 font-poppins text-sm text-muted">
              Kelola verifikasi akun sivitas akademika UIB.
            </Text>

            {/* Filter */}
            <Text className="mb-3 font-poppins-medium text-sm text-black">
              Status Pendaftaran
            </Text>

            <View className="mb-5 flex-row flex-wrap gap-2">
              {statuses.map((status) => {
                const active = filter === status;

                return (
                  <Pressable
                    key={status}
                    onPress={() => setFilter(status)}
                    className={`rounded-full border px-4 py-2.5 ${
                      active
                        ? "border-primary bg-primary"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`font-poppins-medium text-xs ${
                        active
                          ? "text-white"
                          : "text-muted"
                      }`}
                    >
                      {statusLabel[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Search */}
            <Text className="mb-2 font-poppins-medium text-sm text-black">
              Cari Pengguna
            </Text>

            <View className="mb-4">
              <Input
                placeholder="Nama, NPM/NIDN, atau email..."
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>

            {/* Jumlah pengguna */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-poppins-medium text-base text-black">
                {statusLabel[filter]}
              </Text>

              <Text className="font-poppins text-xs text-muted">
                {filtered.length} pengguna
              </Text>
            </View>

            {/* Error */}
            {loadError !== "" && (
              <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="font-poppins text-xs text-red-600">
                  {loadError}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl border border-gray-100 bg-white px-5 py-12">
            {refreshing ? (
              <ActivityIndicator color="#208AEF" />
            ) : (
              <>
                <Text className="font-poppins-medium text-base text-black">
                  Tidak ada pengguna
                </Text>

                <Text className="mt-2 text-center font-poppins text-xs text-muted">
                  Data akan muncul otomatis saat tersedia.
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const pending =
            item.approval_status === "pending";

          const approved =
            item.approval_status === "approved";

          const rejected =
            item.approval_status === "rejected";

          const processing =
            actionLoading === item.id;

          return (
            <View className="mb-4 rounded-2xl border border-gray-100 bg-white p-4">
              {/* Informasi pengguna */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-poppins-semibold text-base text-black">
                    {item.full_name || "Nama belum tersedia"}
                  </Text>

                  <Text className="mt-1 font-poppins-medium text-xs text-primary">
                    {item.role}
                  </Text>
                </View>

                <View
                  className={`rounded-full px-3 py-1.5 ${
                    pending
                      ? "bg-amber-50"
                      : approved
                        ? "bg-green-50"
                        : "bg-red-50"
                  }`}
                >
                  <Text
                    className={`font-poppins-medium text-[10px] ${
                      pending
                        ? "text-amber-700"
                        : approved
                          ? "text-green-700"
                          : "text-red-700"
                    }`}
                  >
                    {statusLabel[
                      item.approval_status as Status
                    ] ?? item.approval_status}
                  </Text>
                </View>
              </View>

              <View className="my-3 h-px bg-gray-100" />

              {/* Detail pengguna */}
              <View className="gap-2">
                <View>
                  <Text className="font-poppins text-[10px] text-muted">
                    NPM / NIDN / Identitas
                  </Text>

                  <Text className="font-poppins-medium text-sm text-black">
                    {item.identifier || "Tidak tersedia"}
                  </Text>
                </View>

                <View>
                  <Text className="font-poppins text-[10px] text-muted">
                    Email
                  </Text>

                  <Text className="font-poppins text-sm text-black">
                    {item.email || "Tidak tersedia"}
                  </Text>
                </View>

                {item.created_at && (
                  <View>
                    <Text className="font-poppins text-[10px] text-muted">
                      Tanggal Pendaftaran
                    </Text>

                    <Text className="font-poppins text-xs text-muted">
                      {new Date(
                        item.created_at
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {/* Tombol aksi langsung */}
              <View className="mt-4 flex-row gap-2">
                {approved ? (
                  <Pressable
                    onPress={() =>
                      changeStatus(item, "rejected")
                    }
                    disabled={!!actionLoading}
                    className="flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-3"
                    style={{
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    {processing ? (
                      <ActivityIndicator color="#DC2626" />
                    ) : (
                      <Text className="font-poppins-medium text-xs text-red-600">
                        Cabut Approval
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() =>
                      changeStatus(item, "approved")
                    }
                    disabled={!!actionLoading}
                    className="flex-1 items-center justify-center rounded-xl bg-primary px-3 py-3"
                    style={{
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    {processing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-poppins-medium text-xs text-white">
                        {rejected
                          ? "Setujui Kembali"
                          : "Setujui"}
                      </Text>
                    )}
                  </Pressable>
                )}

                {pending && (
                  <Pressable
                    onPress={() =>
                      changeStatus(item, "rejected")
                    }
                    disabled={!!actionLoading}
                    className="flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-3"
                    style={{
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    {processing ? (
                      <ActivityIndicator color="#DC2626" />
                    ) : (
                      <Text className="font-poppins-medium text-xs text-red-600">
                        Tolak
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
