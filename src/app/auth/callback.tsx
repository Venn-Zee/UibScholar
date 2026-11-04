import { supabase } from "@/src/lib/supabase";
import { Role, parseRole } from "@/src/types/user";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string; role?: string; error_description?: string }>();
  const handled = useRef(false);
  const [message, setMessage] = useState("Memverifikasi email...");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    (async () => {
      const role: Role = parseRole(params.role);
      if (params.error_description) {
        setMessage("Verifikasi gagal.");
        Alert.alert("Verifikasi gagal", String(params.error_description), [
          { text: "OK", onPress: () => router.replace({ pathname: "/login", params: { role } }) },
        ]);
        return;
      }
      if (params.token_hash && params.type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: String(params.token_hash),
          type: params.type as "signup",
        });
        if (error) {
          setMessage("Link verifikasi tidak valid atau sudah digunakan.");
          Alert.alert("Verifikasi gagal", error.message, [
            { text: "Ke Login", onPress: () => router.replace({ pathname: "/login", params: { role } }) },
          ]);
          return;
        }
      }
      setMessage("Email berhasil diverifikasi. Mengarahkan ke Login...");
      await supabase.auth.signOut();
      router.replace({ pathname: "/login", params: { role } });
    })();
  }, [params.token_hash, params.type, params.role, params.error_description, router]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-8">
        <ActivityIndicator size="large" />
        <Text className="mt-5 text-center font-poppins-medium text-base text-primary">{message}</Text>
      </View>
    </SafeAreaView>
  );
}
