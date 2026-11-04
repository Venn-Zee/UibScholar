
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useAuth } from "@/src/context/auth";
import { IDENTIFIER_LABEL, parseRole } from "@/src/types/user";
import { supabase } from "@/src/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const router = useRouter();
  const role = parseRole(useLocalSearchParams<{ role?: string }>().role);
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [identifierAvailable, setIdentifierAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingIdentifier, setCheckingIdentifier] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitLock = useRef(false);
  const emailRequest = useRef(0);
  const identifierRequest = useRef(0);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIdentifier = identifier.trim();

  const emailFormatValid = EMAIL_REGEX.test(normalizedEmail);

  const identifierFormatValid =
    role === "Dosen"
      ? /^\d{10}$/.test(normalizedIdentifier)
      : role === "Umum"
        ? true
        : /^\d{7}$/.test(normalizedIdentifier);

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const passwordValid = Object.values(passwordRules).every(Boolean);
  const confirmValid = confirm.length > 0 && confirm === password;

  const nameError = name.trim() ? "" : "Nama lengkap wajib diisi.";

  const emailError =
    !emailTouched || !email
      ? ""
      : !emailFormatValid
        ? "Format email tidak valid."
        : checkingEmail
          ? "Memeriksa email..."
          : emailAvailable === false
            ? "Email sudah terdaftar."
            : emailAvailable === null
              ? "Email belum berhasil diperiksa."
              : "";

  const identifierError =
    role === "Umum" || !identifierTouched || !identifier
      ? ""
      : !identifierFormatValid
        ? role === "Dosen"
          ? "NIDN harus tepat 10 digit angka."
          : "NPM harus tepat 7 digit angka."
        : checkingIdentifier
          ? `Memeriksa ${IDENTIFIER_LABEL[role]}...`
          : identifierAvailable === false
            ? `${IDENTIFIER_LABEL[role]} sudah terdaftar.`
            : identifierAvailable === null
              ? `${IDENTIFIER_LABEL[role]} belum berhasil diperiksa.`
              : "";

  const passwordError =
    !passwordTouched || !password || passwordValid
      ? ""
      : "Password belum memenuhi semua persyaratan.";

  const confirmError =
    !confirmTouched || !confirm
      ? ""
      : confirm !== password
        ? "Konfirmasi password tidak sama."
        : "";

  // VALIDASI EMAIL REALTIME
  useEffect(() => {
    const requestId = ++emailRequest.current;

    if (!emailFormatValid) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    setEmailAvailable(null);

    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        "check_registration_duplicate",
        {
          p_email: normalizedEmail,
          p_identifier: null,
        }
      );

      if (requestId !== emailRequest.current) return;

      setCheckingEmail(false);

      if (error || !data) {
        setEmailAvailable(null);
        return;
      }

      setEmailAvailable(!data.email_exists);
    }, 500);

    return () => clearTimeout(timer);
  }, [normalizedEmail, emailFormatValid]);

  // VALIDASI NPM / NIDN REALTIME
  useEffect(() => {
    const requestId = ++identifierRequest.current;

    if (role === "Umum" || !identifierFormatValid) {
      setIdentifierAvailable(null);
      setCheckingIdentifier(false);
      return;
    }

    setCheckingIdentifier(true);
    setIdentifierAvailable(null);

    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        "check_registration_duplicate",
        {
          p_email: "",
          p_identifier: normalizedIdentifier,
        }
      );

      if (requestId !== identifierRequest.current) return;

      setCheckingIdentifier(false);

      if (error || !data) {
        setIdentifierAvailable(null);
        return;
      }

      setIdentifierAvailable(!data.identifier_exists);
    }, 500);

    return () => clearTimeout(timer);
  }, [normalizedIdentifier, role, identifierFormatValid]);

  const formValid =
    name.trim().length > 0 &&
    emailFormatValid &&
    emailAvailable === true &&
    !checkingEmail &&
    (role === "Umum" ||
      (identifierFormatValid &&
        identifierAvailable === true &&
        !checkingIdentifier)) &&
    passwordValid &&
    confirmValid;

  const onSubmit = async () => {
    if (submitLock.current || !formValid) return;

    submitLock.current = true;
    setSubmitting(true);

    try {
      // CEK ULANG SEBELUM REGISTRASI
      const { data, error } = await supabase.rpc(
        "check_registration_duplicate",
        {
          p_email: normalizedEmail,
          p_identifier:
            role === "Umum" ? null : normalizedIdentifier,
        }
      );

      if (error || !data) {
        throw new Error(
          "Gagal memeriksa data registrasi. Coba kembali."
        );
      }

      if (data.email_exists) {
        setEmailAvailable(false);
        return;
      }

      if (data.identifier_exists) {
        setIdentifierAvailable(false);
        return;
      }

      await register({
        role,
        identifier: normalizedIdentifier,
        password,
        name: name.trim(),
        email: normalizedEmail,
      });

      router.replace({
        pathname: "/verify-email",
        params: {
          email: normalizedEmail,
          role,
        },
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Registrasi gagal.";

      console.error("Register error:", e);
        alert(message);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const ErrorText = ({ message }: { message: string }) =>
    message ? (
      <Text className="mt-1 px-1 font-poppins text-xs text-red-500">
        {message}
      </Text>
    ) : null;

  const StatusText = ({
    message,
    success,
  }: {
    message: string;
    success?: boolean;
  }) =>
    message ? (
      <Text
        className={`mt-1 px-1 font-poppins text-xs ${
          success ? "text-green-600" : "text-red-500"
        }`}
      >
        {message}
      </Text>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Daftar" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-8 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-4 font-poppins text-sm text-muted">
            Daftar sebagai {role}
          </Text>

          <View className="gap-3">
            {/* NAMA */}
            <View>
              <Input
                placeholder="Nama lengkap"
                value={name}
                onChangeText={setName}
              />
              <ErrorText message={nameError} />
            </View>

            {/* NPM / NIDN */}
            {role !== "Umum" && (
              <View>
                <Input
                  placeholder={IDENTIFIER_LABEL[role]}
                  value={identifier}
                  onChangeText={(value) => {
                    const digitsOnly = value.replace(/\D/g, "");

                    setIdentifier(
                      role === "Dosen"
                        ? digitsOnly.slice(0, 10)
                        : digitsOnly.slice(0, 7)
                    );

                    setIdentifierTouched(true);
                  }}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                />

                <StatusText message={identifierError} />

                {identifierAvailable === true &&
                  identifierFormatValid && (
                    <StatusText
                      message={`${IDENTIFIER_LABEL[role]} tersedia.`}
                      success
                    />
                  )}
              </View>
            )}

            {/* EMAIL */}
            <View>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailTouched(true);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <StatusText message={emailError} />

              {emailAvailable === true && emailFormatValid && (
                <StatusText message="Email tersedia." success />
              )}
            </View>

            {/* PASSWORD */}
            <View>
              <Input
                placeholder="Password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordTouched(true);
                }}
                isPassword
              />

              <View className="mt-2 gap-1 px-1">
                <Text
                  className={`font-poppins text-xs ${
                    passwordRules.length ? "text-green-600" : "text-muted"
                  }`}
                >
                  {passwordRules.length ? "✓" : "○"} Minimal 8 karakter
                </Text>

                <Text
                  className={`font-poppins text-xs ${
                    passwordRules.uppercase ? "text-green-600" : "text-muted"
                  }`}
                >
                  {passwordRules.uppercase ? "✓" : "○"} Huruf kapital
                </Text>

                <Text
                  className={`font-poppins text-xs ${
                    passwordRules.number ? "text-green-600" : "text-muted"
                  }`}
                >
                  {passwordRules.number ? "✓" : "○"} Angka
                </Text>

                <Text
                  className={`font-poppins text-xs ${
                    passwordRules.symbol ? "text-green-600" : "text-muted"
                  }`}
                >
                  {passwordRules.symbol ? "✓" : "○"} Simbol
                </Text>
              </View>

              <ErrorText message={passwordError} />
            </View>

            {/* KONFIRMASI PASSWORD */}
            <View>
              <Input
                placeholder="Konfirmasi password"
                value={confirm}
                onChangeText={(value) => {
                  setConfirm(value);
                  setConfirmTouched(true);
                }}
                isPassword
              />

              <StatusText
                message={
                  confirmError ||
                  (confirmValid ? "Password cocok." : "")
                }
                success={confirmValid}
              />
            </View>
          </View>

          {/* BUTTON */}
          <View className="mt-6">
            <Button
              label="Daftar"
              onPress={onSubmit}
              loading={submitting}
              disabled={submitting || !formValid}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
