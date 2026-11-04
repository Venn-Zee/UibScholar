
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Client utama untuk login, registrasi, dan autentikasi aplikasi.
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage:
        Platform.OS === "web"
          ? undefined
          : AsyncStorage,

      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  }
);

// Client terpisah khusus pemulihan password.
// Sesi recovery tidak bercampur dengan sesi login utama.
export const recoverySupabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage:
        Platform.OS === "web"
          ? undefined
          : AsyncStorage,

      storageKey: "uibscholar-recovery-session",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
