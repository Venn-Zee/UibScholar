import { LogoutDialog } from "@/src/components/ui/LogoutDialog";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useAuth } from "@/src/context/auth";
import { useRouter } from "expo-router";
import { ChevronRight, FileText, LogOut, Pencil } from "lucide-react-native";
import { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Row({ icon, label, onPress, danger }: { icon: ReactNode; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 border-b border-line px-4 py-4 active:opacity-70">
      {icon}
      <Text className={`flex-1 font-poppins-medium text-sm ${danger ? "text-red-600" : "text-primary"}`}>{label}</Text>
      {!danger && <ChevronRight size={18} color="#7A8494" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  async function handleLogout() {
    const currentRole = user?.role;
    await logout();
    setShowLogout(false);
    router.dismissAll();
    if (currentRole) {
      router.replace({ pathname: "/login", params: { role: currentRole } });
    } else {
      router.replace("/login");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Pengaturan" />
      <View className="mx-5 mt-2 overflow-hidden rounded-2xl bg-white">
        <Row icon={<Pencil size={18} color="#1F3F6E" />} label="Edit Profil" onPress={() => router.push("/edit-profile")} />
        <Row icon={<FileText size={18} color="#1F3F6E" />} label="Syarat & Ketentuan" onPress={() => router.push("/terms")} />
        <Row
          icon={<LogOut size={18} color="#DC2626" />}
          label="Keluar"
          danger
          onPress={() => setShowLogout(true)}
        />
      </View>
      <Text className="mt-6 text-center font-poppins text-[11px] text-muted">UIBScholar v1.0.0</Text>

      <LogoutDialog
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}
