
import { Button } from "@/src/components/ui/Button";
import { Image } from "@/src/components/ui/Image";
import { Input } from "@/src/components/ui/Input";
import { MAX_FORM_WIDTH, useResponsive } from "@/src/hooks/use-responsive";
import { recoverySupabase } from "@/src/lib/supabase";
import type { Role } from "@/src/types/user";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ResetParams = {
  token_hash?: string | string[];
  type?: string | string[];
  role?: string | string[];
  error?: string | string[];
  error_code?: string | string[];
  error_description?: string | string[];
};

function getParam(
  value: string | string[] | undefined
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function normalizeRole(value: string): Role {
  const normalized = value.trim().toLowerCase();

  if (normalized === "mahasiswa") return "Mahasiswa";
  if (normalized === "alumni") return "Alumni";
  if (normalized === "dosen") return "Dosen";

  return "Umum";
}

export default function ResetPassword() {
  const router = useRouter();
  const { authPadding } = useResponsive();

  const params = useLocalSearchParams<ResetParams>();

  const tokenHash = getParam(params.token_hash);
  const tokenType = getParam(params.type);

  // Role dipertahankan dari URL email.
  const role = normalizeRole(getParam(params.role));

  const routeError =
    getParam(params.error_description) ||
    getParam(params.error);

  const errorCode = getParam(params.error_code);

  const [verifying, setVerifying] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const passwordChecks = [
    {
      label: "Minimal 8 karakter",
      valid: password.length >= 8,
    },
    {
      label: "Huruf kapital (A-Z)",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Huruf kecil (a-z)",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Angka (0-9)",
      valid: /[0-9]/.test(password),
    },
    {
      label: "Karakter khusus (!@#$%)",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const isPasswordValid = passwordChecks.every(
    (item) => item.valid
  );

  const isConfirmValid =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const backToLogin = () => {
    router.replace({
      pathname: "/login",
      params: {
        role,
      },
    });
  };

  const onVerifyResetLink = async () => {
    if (!tokenHash || tokenType !== "recovery") {
      setInvalidToken(true);
      setError(
        "Tautan reset tidak valid. Silakan minta tautan baru."
      );
      return;
    }

    if (verifying) return;

    setVerifying(true);
    setError(undefined);

    try {
      const { data, error } =
        await recoverySupabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

      if (error) throw error;

      if (!data.session) {
        throw new Error(
          "Sesi pemulihan tidak berhasil dibuat."
        );
      }

      setRecoveryReady(true);
      setInvalidToken(false);
      setError(undefined);

      // Hapus token dari URL, tetapi pertahankan role.
      router.setParams({
        token_hash: undefined,
        type: undefined,
        error: undefined,
        error_code: undefined,
        error_description: undefined,
        role,
      });
    } catch (e) {
      console.error(
        "VERIFY RESET LINK ERROR:",
        e
      );

      setInvalidToken(true);
      setRecoveryReady(false);

      setError(
        e instanceof Error
          ? e.message
          : "Tautan tidak valid atau sudah digunakan."
      );
    } finally {
      setVerifying(false);
    }
  };

  const onUpdatePassword = async () => {
    setError(undefined);

    if (!isPasswordValid) {
      setError(
        "Password belum memenuhi semua persyaratan."
      );
      return;
    }

    if (!isConfirmValid) {
      setError(
        "Konfirmasi password tidak sesuai."
      );
      return;
    }

    if (!recoveryReady) {
      setError(
        "Sesi pemulihan tidak tersedia. Silakan minta tautan baru."
      );
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const { error: updateError } =
        await recoverySupabase.auth.updateUser({
          password,
        });

      if (updateError) throw updateError;

      await recoverySupabase.auth.signOut({
        scope: "local",
      });

      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (e) {
      console.error(
        "UPDATE PASSWORD ERROR:",
        e
      );

      setError(
        e instanceof Error
          ? e.message
          : "Gagal memperbarui password."
      );
    } finally {
      setSaving(false);
    }
  };

  const hasRecoveryToken =
    Boolean(tokenHash) &&
    tokenType === "recovery";

  const hasExpiredLink =
    Boolean(routeError) ||
    Boolean(errorCode) ||
    invalidToken;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: authPadding,
            paddingVertical: 24,
            width: "100%",
            maxWidth: MAX_FORM_WIDTH,
            alignSelf: "center",
          }}
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
            Pemulihan Akun
          </Text>
        </View>

        {verifying ? (
          <View className="w-full items-center">
            <ActivityIndicator
              size="large"
              color="#208AEF"
            />

            <Text className="mt-5 text-center font-poppins-medium text-sm text-primary">
              Memverifikasi tautan pemulihan...
            </Text>
          </View>
        ) : success ? (
          <View className="w-full items-center">
            <Text className="mb-3 text-center font-poppins-medium text-lg text-black">
              Password Berhasil Diubah
            </Text>

            <Text className="mb-6 text-center font-poppins text-sm text-muted">
              Password akun kamu sudah berhasil diperbarui.
              Silakan login menggunakan password baru.
            </Text>

            <View className="w-full">
              <Button
                label="Kembali ke Login"
                onPress={backToLogin}
              />
            </View>
          </View>
        ) : !recoveryReady ? (
          <View className="w-full items-center">
            <Text className="mb-3 text-center font-poppins-medium text-lg text-black">
              {hasExpiredLink
                ? "Tautan Tidak Valid"
                : "Verifikasi Pemulihan Akun"}
            </Text>

            <Text className="mb-6 text-center font-poppins text-xs text-muted">
              {hasExpiredLink
                ? "Tautan reset sudah digunakan, tidak valid, atau kedaluwarsa. Silakan minta tautan baru."
                : "Tekan tombol di bawah untuk memverifikasi tautan dari email sebelum membuat password baru."}
            </Text>

            {error && (
              <Text className="mb-4 text-center font-poppins text-xs text-red-500">
                {error}
              </Text>
            )}

            {hasRecoveryToken && !hasExpiredLink ? (
              <View className="w-full">
                <Button
                  label="Verifikasi Tautan"
                  onPress={onVerifyResetLink}
                />
              </View>
            ) : (
              <View className="w-full">
                <Button
                  label="Minta Tautan Baru"
                  onPress={backToLogin}
                />
              </View>
            )}
          </View>
        ) : (
          <View className="w-full">
            <Text className="mb-2 text-center font-poppins-medium text-lg text-black">
              Buat Password Baru
            </Text>

            <Text className="mb-6 text-center font-poppins text-xs text-muted">
              Buat password baru yang kuat untuk akun UIBScholar kamu.
            </Text>

            <View className="gap-3">
              <Input
                placeholder="Password baru"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(undefined);
                }}
                isPassword
                error={error}
              />

              <View className="ml-1 mt-1 gap-2">
                <Text className="mb-1 font-poppins-medium text-xs text-black">
                  Persyaratan password:
                </Text>

                {passwordChecks.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center gap-2"
                  >
                    <Text
                      style={{
                        color: item.valid
                          ? "#16A34A"
                          : "#888888",
                      }}
                      className="font-poppins-medium text-xs"
                    >
                      {item.valid ? "✓" : "○"}
                    </Text>

                    <Text
                      style={{
                        color: item.valid
                          ? "#16A34A"
                          : "#888888",
                      }}
                      className="font-poppins text-xs"
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              {isPasswordValid && (
                <Text className="ml-1 font-poppins-medium text-xs text-green-600">
                  Password memenuhi semua persyaratan.
                </Text>
              )}

              <Input
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setError(undefined);
                }}
                isPassword
              />

              {confirmPassword.length > 0 && (
                <Text
                  className="ml-1 font-poppins text-xs"
                  style={{
                    color: isConfirmValid
                      ? "#16A34A"
                      : "#DC2626",
                  }}
                >
                  {isConfirmValid
                    ? "✓ Password cocok."
                    : "✕ Password belum cocok."}
                </Text>
              )}
            </View>

            {error && (
              <Text className="mt-3 font-poppins text-xs text-red-500">
                {error}
              </Text>
            )}

            <View className="mt-6">
              <Button
                label={
                  saving
                    ? "Menyimpan..."
                    : "Simpan Password Baru"
                }
                onPress={onUpdatePassword}
              />
            </View>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
