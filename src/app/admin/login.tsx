
import { Button } from "@/src/components/ui/Button";
import { Image } from "@/src/components/ui/Image";
import { Input } from "@/src/components/ui/Input";
import { supabase } from "@/src/lib/supabase";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) throw loginError;

      const userId = data.user.id;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

      if (profileError) throw profileError;

      if (
        String(profile?.role ?? "")
          .trim()
          .toLowerCase() !== "admin"
      ) {
        await supabase.auth.signOut();

        throw new Error(
          "Akun ini tidak memiliki akses administrator."
        );
      }

      router.replace("/admin");
    } catch (e) {
      console.error("ADMIN LOGIN ERROR:", e);

      setError(
        e instanceof Error
          ? e.message
          : "Terjadi kesalahan saat login administrator."
      );

      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Stack.Screen
        options={{
          title: "Admin Login",
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        className="flex-1 items-center justify-center px-8"
      >
        <View className="w-full max-w-[440px] items-center">
          <Image
            className="mb-5 h-[85px] w-[94px] rounded-lg"
            source={require("@/assets/images/logo_uib.webp")}
            contentFit="contain"
          />

          <View className="mb-8 items-center">
            <Text className="font-poppins-bold text-3xl text-primary">
              UIBScholar
            </Text>

            <Text className="mt-1 font-poppins text-xs text-muted">
              Administrator Portal
            </Text>
          </View>

          <Text className="mb-2 text-center font-poppins-medium text-lg text-black">
            Masuk Administrator
          </Text>

          <Text className="mb-6 text-center font-poppins text-sm text-muted">
            Masuk untuk mengelola verifikasi akun kampus.
          </Text>

          <View className="w-full gap-3">
            <Input
              placeholder="Email Administrator"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(undefined);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError(undefined);
              }}
              isPassword
            />
          </View>

          {error && (
            <Text className="mt-3 w-full font-poppins text-xs text-red-500">
              {error}
            </Text>
          )}

          <View className="mt-6 w-full">
            <Button
              label={
                loading
                  ? "Memeriksa akun..."
                  : "Login Administrator"
              }
              onPress={handleLogin}
            />
          </View>

          <View className="mt-5">
            <Text
              onPress={() => router.replace("/welcome")}
              className="font-poppins text-sm text-muted"
            >
              Kembali ke halaman utama
            </Text>
          </View>

          <Text className="mt-8 text-center font-poppins text-[11px] text-muted">
            UIBScholar · Administrator Access
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
