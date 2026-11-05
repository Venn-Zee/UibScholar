import { Button } from "@/src/components/ui/Button";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { supabase } from "@/src/lib/supabase";
import { Role, parseRole } from "@/src/types/user";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; role?: string }>();
  const email = params.email ?? "";
  const role: Role = parseRole(params.role);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (sending || !email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: "uibscholar://auth/callback?role=" + encodeURIComponent(role) },
    });
    setSending(false);
    Alert.alert(error ? "Gagal mengirim" : "Email dikirim", error?.message ?? "Link verifikasi baru telah dikirim.");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Verifikasi Email" />
      <ScrollView contentContainerClassName="flex-grow items-center justify-center px-8 py-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="mb-5 text-5xl">✉️</Text>
        <Text className="mb-3 text-center font-poppins-bold text-2xl text-primary">Periksa email kamu</Text>
        <Text className="mb-2 text-center font-poppins text-sm text-muted">Kami mengirim link verifikasi ke:</Text>
        <Text className="mb-6 text-center font-poppins-semibold text-base text-black">{email}</Text>
        <Text className="mb-8 text-center font-poppins text-sm text-muted">
          Buka email tersebut, lalu tekan link Verifikasi Email. Setelah email terverifikasi, UibScholar akan mengarahkan kamu ke halaman login sebagai {role}.
          {"\n\n"}Periksa juga folder Spam jika email belum terlihat.
        </Text>
        <View className="w-full gap-3">
          <Button label="Kirim ulang email" onPress={resend} loading={sending} disabled={sending} />
          <Button label="Kembali ke Login" onPress={() => router.replace({ pathname: "/login", params: { role } })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
