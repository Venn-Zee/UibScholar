
import { Button } from "@/src/components/ui/Button";
import { Image } from "@/src/components/ui/Image";
import { Input } from "@/src/components/ui/Input";
import { useAuth } from "@/src/context/auth";
import {
  recoverySupabase,
  supabase,
} from "@/src/lib/supabase";
import { IDENTIFIER_LABEL, parseRole } from "@/src/types/user";
import {
  Link,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import * as ExpoLinking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoginError = Error & {
  code?: string;
  retryAfter?: number;
  remainingAttempts?: number;
};

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

export default function Login() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    role?: string;
  }>();

  const role = parseRole(params.role);
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);

  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string>();
  const [forgotError, setForgotError] = useState<string>();

  const isLocked = lockRemaining > 0;

  // Hitung mundur lock.
  useEffect(() => {
    if (lockUntil === null) {
      setLockRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((lockUntil - Date.now()) / 1000)
      );

      setLockRemaining(remaining);

      if (remaining <= 0) {
        setLockUntil(null);
        setError(undefined);
      }
    };

    updateCountdown();

    const timer = setInterval(
      updateCountdown,
      250
    );

    return () => clearInterval(timer);
  }, [lockUntil]);

  // Cek status lock dari server.
  // Ini membuat lock tetap berlaku setelah refresh.
  useEffect(() => {
    const normalizedIdentifier = identifier.trim();

    setLockUntil(null);

    if (!normalizedIdentifier) return;

    let active = true;

    const timeout = setTimeout(async () => {
      try {
        const { data, error } =
          await supabase.functions.invoke(
            "login-with-lock",
            {
              body: {
                action: "status",
                role: role.toLowerCase(),
                identifier: normalizedIdentifier,
              },
            }
          );

        if (!active || error) return;

        if (data?.code === "LOGIN_LOCKED") {
          const retryAfter = Math.max(
            1,
            Number(data.retryAfter ?? 60)
          );

          setLockUntil(
            Date.now() + retryAfter * 1000
          );

          setPassword("");
          setError(
            "Terlalu banyak percobaan login. Form dikunci sementara."
          );
        } else if (data?.ok) {
          setLockUntil(null);
        }
      } catch (e) {
        console.error(
          "CHECK LOGIN LOCK ERROR:",
          e
        );
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [identifier, role]);


const onLogin = async () => {
  if (isLocked) return;

  if (!identifier.trim() || !password) {
    setError("Masukkan identitas dan password.");
    return;
  }

  setError(undefined);

  try {
    await login({
      role,
      identifier: identifier.trim(),
      password,
    });

  } catch (e) {
    const loginError = e as LoginError;

    setPassword("");

    // Penguncian adalah kondisi normal, bukan error aplikasi.
    if (loginError.code === "LOGIN_LOCKED") {
      const retryAfter = Math.max(
        1,
        Number(loginError.retryAfter ?? 60)
      );

      setLockUntil(Date.now() + retryAfter * 1000);

      setError(
        "Terlalu banyak percobaan login. Form dikunci sementara."
      );

      return;
    }

    // Password atau identitas salah.
    if (loginError.code === "INVALID_CREDENTIALS") {
      const remaining = Number(
        loginError.remainingAttempts ?? 0
      );

      setError(
        `Identitas atau password salah. ${
          remaining > 0
            ? `Sisa ${remaining} percobaan sebelum form dikunci.`
            : ""
        }`
      );

      return;
    }

    // Hanya error yang tidak terduga yang dicatat.
    console.error("UNEXPECTED LOGIN ERROR:", loginError);

    setError(
      loginError.message ||
        "Login gagal. Silakan coba kembali."
    );
  }
};


  // Forgot Password tidak terpengaruh oleh lock login.

  const onForgotPassword = async () => {
    const normalizedIdentifier = identifier.trim();

    setForgotError(undefined);
    setForgotMessage(undefined);

    if (!normalizedIdentifier) {
      setForgotError(
        `Masukkan ${IDENTIFIER_LABEL[role]} terlebih dahulu.`
      );
      return;
    }

    if (forgotLoading) return;

    setForgotLoading(true);

    try {
      const redirectTo = ExpoLinking.createURL(
        "auth/reset-password",
        {
          queryParams: {
            role,
          },
        }
      );

      const { error } =
        await supabase.functions.invoke(
          "forgot-password",
          {
            body: {
              role: role.toLowerCase(),
              identifier: normalizedIdentifier,
              redirectTo,
            },
          }
        );

      if (error) throw error;

      setForgotMessage(
        "Jika identitas tersebut terdaftar, tautan reset password akan dikirim ke email akun kamu. Silakan periksa inbox atau folder spam."
      );
    } catch (e) {
      console.error("FORGOT PASSWORD ERROR:", e);

      setForgotError(
        "Permintaan reset password belum dapat diproses. Silakan coba kembali."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const countdown = formatCountdown(lockRemaining);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        className="flex-1 items-center justify-center px-12"
      >
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
            Masuk sebagai {role}
          </Text>
        </View>

        <Text className="mb-4 font-poppins-medium text-lg text-black">
          Masuk ke Akun Anda
        </Text>

        <View className="w-full gap-3">
          <Input
            placeholder={IDENTIFIER_LABEL[role]}
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              setError(undefined);
              setForgotError(undefined);
              setForgotMessage(undefined);
            }}
            autoCapitalize="none"
            keyboardType={
              role === "Umum"
                ? "email-address"
                : role === "Dosen"
                  ? "default"
                  : "number-pad"
            }
          />

          {/* Password terkunci, identitas tetap bisa dilihat. */}
          <View
            pointerEvents={isLocked ? "none" : "auto"}
            style={{
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <Input
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError(undefined);
              }}
              isPassword
              error={error}
            />
          </View>
        </View>

        {/* Tombol Login terkunci sementara. */}
        <View className="mt-6 w-full">
          <View
            pointerEvents={isLocked ? "none" : "auto"}
            style={{
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <Button
              label={
                isLocked
                  ? `Terkunci (${countdown})`
                  : "Login"
              }
              onPress={onLogin}
            />
          </View>
        </View>

        {isLocked && (
          <View className="mt-3 w-full items-center">
            <Text className="text-center font-poppins-medium text-xs text-red-500">
              Terlalu banyak percobaan login.
            </Text>

            <Text className="mt-1 text-center font-poppins text-xs text-muted">
              Form dapat digunakan kembali dalam {countdown}.
            </Text>
          </View>
        )}

        {/* Lupa Password tetap aktif. */}
        <View className="mt-3 w-full items-end">
          <Pressable
            onPress={onForgotPassword}
            disabled={forgotLoading}
            hitSlop={8}
          >
            <View className="flex-row items-center gap-2">
              {forgotLoading && (
                <ActivityIndicator
                  size="small"
                  color="#208AEF"
                />
              )}

              <Text className="font-poppins-medium text-xs text-accent">
                {forgotLoading
                  ? "Mengirim tautan..."
                  : "Lupa Password?"}
              </Text>
            </View>
          </Pressable>
        </View>

        {forgotMessage && (
          <Text className="mt-3 w-full text-center font-poppins text-xs text-accent">
            {forgotMessage}
          </Text>
        )}

        {forgotError && (
          <Text className="mt-3 w-full text-center font-poppins text-xs text-red-500">
            {forgotError}
          </Text>
        )}

        <View className="mt-4 flex-row justify-center">
          <Text className="font-poppins text-sm text-black">
            Belum punya akun?{" "}
          </Text>

          <Link
            href={{
              pathname: "/register",
              params: { role },
            }}
            className="font-poppins-medium text-sm text-accent"
          >
            Daftar
          </Link>
        </View>

        <Text className="mt-8 text-center font-poppins text-[11px] text-muted">
          {role === "Umum"
            ? "Gunakan email dan password."
            : "Gunakan identitas kampus dan password."}
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
