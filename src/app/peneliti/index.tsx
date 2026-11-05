import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useResponsive } from "@/src/hooks/use-responsive";
import { getResearchers, type Researcher } from "@/src/lib/search";
import { useRouter } from "expo-router";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type RoleFilter = "semua" | "dosen" | "mahasiswa";

/** Heuristik: nama dengan gelar akademik → Dosen */
function getRole(name: string): "dosen" | "mahasiswa" {
  if (
    name.includes(",") ||
    /\b(S\.|M\.|Dr\.|Prof\.|Ir\.|M\.T\.|M\.Kom\.|S\.Kom\.|S\.E\.|M\.Ak\.|S\.H\.|M\.H\.)/i.test(name)
  ) {
    return "dosen";
  }
  return "mahasiswa";
}

/** Mapping program studi → fakultas (sama dengan di [name].tsx) */
function getFaculty(program: string): string {
  const p = (program ?? "").toLowerCase();
  if (p.includes("sistem informasi") || p.includes("teknik informatika") || p.includes("komputer")) {
    return "Ilmu Komputer";
  }
  if (p.includes("manajemen") || p.includes("akuntansi") || p.includes("pariwisata") || p.includes("bisnis")) {
    return "Bisnis dan Manajemen";
  }
  if (p.includes("sipil") || p.includes("arsitektur") || p.includes("elektro") || p.includes("teknik")) {
    return "Teknik Sipil dan Perencanaan";
  }
  if (p.includes("hukum")) return "Hukum";
  return "Ilmu Komputer";
}

/** Ambil semua program studi unik dari data */
function allPrograms(researchers: Researcher[]): string[] {
  const set = new Set<string>();
  researchers.forEach((r) => r.programs.forEach((p) => set.add(p)));
  return [...set].sort((a, b) => a.localeCompare(b));
}

function allFaculties(researchers: Researcher[]): string[] {
  const set = new Set<string>();
  researchers.forEach((r) => r.programs.forEach((p) => set.add(getFaculty(p))));
  return [...set].sort((a, b) => a.localeCompare(b));
}

interface FilterState {
  role: RoleFilter;
  fakultas: string;
  programStudi: string;
  bidangKeahlian: string;
}

const defaultFilter: FilterState = {
  role: "semua",
  fakultas: "",
  programStudi: "",
  bidangKeahlian: "",
};

export default function Peneliti() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { columns, gridItemWidth, gridGap } = useResponsive();

  const [query, setQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  /* Applied filters (confirmed by Terapkan button) */
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(defaultFilter);
  /* Draft filters (edited inside modal before Terapkan) */
  const [draftFilter, setDraftFilter] = useState<FilterState>(defaultFilter);

  const allResearchers = useMemo(() => getResearchers(), []);
  const programs = useMemo(() => allPrograms(allResearchers), [allResearchers]);
  const faculties = useMemo(() => allFaculties(allResearchers), [allResearchers]);

  const filtered = useMemo(() => {
    let list = allResearchers;

    // Role chip filter
    if (appliedFilter.role !== "semua") {
      list = list.filter((p) => getRole(p.name) === appliedFilter.role);
    }

    // Fakultas
    if (appliedFilter.fakultas.trim()) {
      list = list.filter((p) =>
        p.programs.some((pr) =>
          getFaculty(pr).toLowerCase().includes(appliedFilter.fakultas.toLowerCase())
        )
      );
    }

    // Program Studi
    if (appliedFilter.programStudi.trim()) {
      list = list.filter((p) =>
        p.programs.some((pr) =>
          pr.toLowerCase().includes(appliedFilter.programStudi.toLowerCase())
        )
      );
    }

    // Bidang Keahlian (search in programs as proxy)
    if (appliedFilter.bidangKeahlian.trim()) {
      const q = appliedFilter.bidangKeahlian.toLowerCase();
      list = list.filter((p) =>
        p.programs.some((pr) => pr.toLowerCase().includes(q)) ||
        p.name.toLowerCase().includes(q)
      );
    }

    // Name search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [allResearchers, appliedFilter, query]);

  const hasActiveFilter =
    appliedFilter.role !== "semua" ||
    !!appliedFilter.fakultas.trim() ||
    !!appliedFilter.programStudi.trim() ||
    !!appliedFilter.bidangKeahlian.trim();

  /* Open modal: copy applied → draft */
  function openModal() {
    setDraftFilter({ ...appliedFilter });
    setShowFilterModal(true);
  }

  /* Apply draft → applied */
  function applyFilter() {
    setAppliedFilter({ ...draftFilter });
    setShowFilterModal(false);
  }

  /* Reset draft (inside modal) */
  function resetDraft() {
    setDraftFilter(defaultFilter);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Nama Peneliti" />

      {/* Search Bar + Filter Icon */}
      <View className="mx-5 mb-3 flex-row items-center gap-2.5">
        <View className="h-12 flex-1 flex-row items-center gap-2 rounded-full border border-field bg-white px-4">
          <Search size={18} color="#1F3F6E" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari nama peneliti...."
            placeholderTextColor="#9AA3B2"
            className="flex-1 font-poppins text-sm text-primary"
          />
        </View>

        {/* Filter button — with dot indicator when active */}
        <Pressable
          onPress={openModal}
          className="h-12 w-12 items-center justify-center rounded-full border border-field bg-white active:opacity-80"
          hitSlop={6}
        >
          <SlidersHorizontal size={18} color={hasActiveFilter ? "#1F3F6E" : "#7A8494"} />
          {hasActiveFilter && (
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#F5B301",
              }}
            />
          )}
        </Pressable>
      </View>

      {/* Role Chip Filters */}
      <View className="mb-3 flex-row gap-2 px-5">
        {(["semua", "dosen", "mahasiswa"] as RoleFilter[]).map((role) => {
          const active = appliedFilter.role === role;
          const label = role.charAt(0).toUpperCase() + role.slice(1);
          return (
            <Pressable
              key={role}
              onPress={() => setAppliedFilter((prev) => ({ ...prev, role }))}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? "#1F3F6E" : "#D1D5DB",
                backgroundColor: active ? "#1F3F6E" : "#FFFFFF",
              }}
            >
              <Text
                className={active ? "font-poppins-semibold text-sm text-white" : "font-poppins text-sm text-primary"}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Researcher List */}
      <FlatList
        key={columns}
        data={filtered}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { gap: gridGap } : undefined}
        keyExtractor={(p) => p.name}
        contentContainerClassName="gap-3 px-5 pb-10"
        renderItem={({ item }) => (
          <View style={gridItemWidth ? { width: gridItemWidth } : undefined}>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/peneliti/[name]", params: { name: item.name } })
              }
              className="grow flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 active:opacity-80"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Text className="font-poppins-bold text-base text-white">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-poppins-bold text-sm text-primary">
                  {item.name}
                </Text>
                <Text className="font-poppins text-[11px] text-muted">
                  {item.programs.join(", ")}
                </Text>
                <Text className="font-poppins text-[11px] text-muted">
                  {item.count} karya penelitian
                </Text>
              </View>
              <ChevronRight size={18} color="#1F3F6E" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center font-poppins text-sm text-muted">
            Peneliti tidak ditemukan.
          </Text>
        }
      />

      {/* ===== Filter Modal ===== */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          onPress={() => setShowFilterModal(false)}
        />

        {/* Bottom Sheet */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            paddingHorizontal: 20,
            paddingTop: 20,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {/* Modal Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Pressable
              onPress={() => setShowFilterModal(false)}
              hitSlop={10}
              style={{ width: 32 }}
            >
              <X size={22} color="#1F3F6E" />
            </Pressable>
            <Text
              style={{ flex: 1, textAlign: "center", fontSize: 16, color: "#1F3F6E" }}
              className="font-poppins-bold"
            >
              Filter Peneliti
            </Text>
            <Pressable onPress={resetDraft} hitSlop={10} style={{ width: 48, alignItems: "flex-end" }}>
              <Text className="font-poppins-medium text-sm" style={{ color: "#F5B301" }}>
                Reset
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Role Chips inside modal */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {(["semua", "dosen", "mahasiswa"] as RoleFilter[]).map((role) => {
                const active = draftFilter.role === role;
                const label = role.charAt(0).toUpperCase() + role.slice(1);
                return (
                  <Pressable
                    key={role}
                    onPress={() => setDraftFilter((prev) => ({ ...prev, role }))}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? "#1F3F6E" : "#D1D5DB",
                      backgroundColor: active ? "#1F3F6E" : "#FFFFFF",
                    }}
                  >
                    <Text
                      className={active ? "font-poppins-semibold text-sm text-white" : "font-poppins text-sm text-primary"}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Fakultas Field */}
            <Text className="mb-1.5 font-poppins-medium text-sm text-primary">Fakultas</Text>
            <TextInput
              value={draftFilter.fakultas}
              onChangeText={(v) => setDraftFilter((prev) => ({ ...prev, fakultas: v }))}
              placeholder="Contoh: Ilmu Komputer"
              placeholderTextColor="#9AA3B2"
              className="font-poppins text-sm text-primary"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingHorizontal: 14,
                marginBottom: 16,
                backgroundColor: "#FFFFFF",
              }}
            />

            {/* Program Studi Field */}
            <Text className="mb-1.5 font-poppins-medium text-sm text-primary">Program Studi</Text>
            <TextInput
              value={draftFilter.programStudi}
              onChangeText={(v) => setDraftFilter((prev) => ({ ...prev, programStudi: v }))}
              placeholder="Contoh: Sistem Informasi"
              placeholderTextColor="#9AA3B2"
              className="font-poppins text-sm text-primary"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingHorizontal: 14,
                marginBottom: 16,
                backgroundColor: "#FFFFFF",
              }}
            />

            {/* Bidang Keahlian Field */}
            <Text className="mb-1.5 font-poppins-medium text-sm text-primary">Bidang Keahlian</Text>
            <TextInput
              value={draftFilter.bidangKeahlian}
              onChangeText={(v) => setDraftFilter((prev) => ({ ...prev, bidangKeahlian: v }))}
              placeholder="Contoh: Machine Learning"
              placeholderTextColor="#9AA3B2"
              className="font-poppins text-sm text-primary"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingHorizontal: 14,
                marginBottom: 24,
                backgroundColor: "#FFFFFF",
              }}
            />
          </ScrollView>

          {/* Terapkan Button */}
          <Pressable
            onPress={applyFilter}
            style={{
              height: 52,
              backgroundColor: "#1F3F6E",
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
            className="active:opacity-90"
          >
            <Text className="font-poppins-bold text-base text-white">Terapkan</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
