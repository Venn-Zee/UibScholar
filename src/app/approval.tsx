import { useAuth } from "@/src/context/auth";
import { Redirect, useRouter } from "expo-router";
import { Clock3, LogOut, ShieldCheck, ShieldX } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ApprovalScreen() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-surface"><ActivityIndicator color="#1F3F6E" /></View>;
  }
  if (!user) return <Redirect href="/welcome" />;
  if (user.role === "Umum" || user.approvalStatus === "approved") return <Redirect href="/(tabs)/home" />;

  const rejected = user.approvalStatus === "rejected";
  const Icon = rejected ? ShieldX : Clock3;
  const title = rejected ? "Verifikasi Ditolak" : "Menunggu Approval";
  const description = rejected
    ? "Pihak kampus belum menyetujui verifikasi identitas kamu. Hubungi admin UibScholar untuk informasi lebih lanjut."
    : "Email kamu sudah terverifikasi. Akun sedang menunggu pemeriksaan dan persetujuan admin kampus. Kamu akan mendapatkan akses setelah akun disetujui.";

  const handleLogout = async () => {
    await logout();
    router.replace("/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
    <ScrollView contentContainerClassName="flex-grow items-center justify-center px-6 py-6" showsVerticalScrollIndicator={false}>
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Icon size={38} color={rejected ? "#DC2626" : "#D97706"} />
      </View>
      <Text className="text-center font-poppins-bold text-2xl text-primary">{title}</Text>
      <Text className="mt-3 max-w-sm text-center font-poppins text-sm leading-6 text-muted">{description}</Text>
      <View className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-white p-4">
        <Text className="font-poppins-medium text-xs text-muted">ROLE</Text>
        <Text className="mt-1 font-poppins-semibold text-base text-primary">{user.role}</Text>
        <Text className="mt-3 font-poppins-medium text-xs text-muted">IDENTITAS</Text>
        <Text className="mt-1 font-poppins-semibold text-base text-primary">{user.identifier}</Text>
        <View className="mt-3 flex-row items-center">
          <ShieldCheck size={16} color={rejected ? "#DC2626" : "#D97706"} />
          <Text className="ml-2 font-poppins-medium text-sm" style={{ color: rejected ? "#DC2626" : "#D97706" }}>
            {rejected ? "Status: Rejected" : "Status: Pending"}
          </Text>
        </View>
      </View>
      <Pressable onPress={handleLogout} className="mt-8 flex-row items-center rounded-xl border border-border px-5 py-3">
        <LogOut size={17} color="#1F3F6E" />
        <Text className="ml-2 font-poppins-semibold text-sm text-primary">Keluar</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}
