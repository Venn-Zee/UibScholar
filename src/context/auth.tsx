
import { Role, User } from "@/src/types/user";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

type LoginInput = {
  role: Role;
  identifier: string;
  password: string;
};

type RegisterInput = LoginInput & {
  name: string;
  email: string;
};

type LoginResultError = Error & {
  code?: string;
  retryAfter?: number;
  remainingAttempts?: number;
};

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<User, "name" | "email" | "studyProgram">>
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const roleToDb = (role: Role) => role.toLowerCase();

const roleFromDb = (role: string): Role => {
  const normalized = role.toLowerCase();

  if (normalized === "dosen") return "Dosen";
  if (normalized === "mahasiswa") return "Mahasiswa";
  if (normalized === "alumni") return "Alumni";

  return "Umum";
};

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  identifier: string | null;
  role: string;
  approval_status: string;
  study_programs: {
    name: string;
  } | null;
};

// Memuat profil berdasarkan session Supabase.
async function loadProfile(
  session: Session
): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name,email,identifier,role,approval_status,study_program_id,study_programs(name)"
    )
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("LOAD PROFILE ERROR:", error);
    return null;
  }

  if (!data) {
    console.warn(
      "Profile belum ditemukan:",
      session.user.id
    );
    return null;
  }

  const program = data.study_programs as unknown as {
    name: string;
  } | null;

  return {
    name: data.full_name ?? "",
    role: roleFromDb(data.role),
    identifier:
      data.identifier ??
      data.email ??
      session.user.email ??
      "",
    email: data.email ?? session.user.email ?? "",
    studyProgram: program?.name ?? "",
    approvalStatus:
      data.approval_status ??
      (data.role === "umum" ? "approved" : "pending"),
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ID Auth disimpan terpisah agar tidak perlu
  // mengubah struktur User pada src/types/user.ts.
  const [authUserId, setAuthUserId] = useState<string | null>(
    null
  );

  // Mengatur tujuan navigasi berdasarkan approval.
  const navigateByApproval = useCallback(
    (status: string) => {
      if (status === "approved") {
        router.replace("/home");
      } else if (
        status === "pending" ||
        status === "rejected"
      ) {
        router.replace("/approval");
      }
    },
    []
  );

  // Memuat ulang profil pengguna.
  const refreshCurrentProfile = useCallback(
    async (session: Session) => {
      const profile = await loadProfile(session);

      setUser(profile);

      return profile;
    },
    []
  );

  // =====================================================
  // INITIAL SESSION + AUTH STATE
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) throw error;

        const session = data.session;

        if (!session) {
          if (mounted) {
            setUser(null);
            setAuthUserId(null);
          }

          return;
        }

        const profile = await loadProfile(session);

        if (mounted) {
          setAuthUserId(session.user.id);
          setUser(profile);
        }
      } catch (error) {
        console.error(
          "SESSION INITIALIZATION ERROR:",
          error
        );

        if (mounted) {
          setUser(null);
          setAuthUserId(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(async () => {
          if (!mounted) return;

          if (!session) {
            setUser(null);
            setAuthUserId(null);
            setLoading(false);
            return;
          }

          setAuthUserId(session.user.id);

          const profile = await loadProfile(session);

          if (mounted) {
            setUser(profile);
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // REALTIME APPROVAL MONITOR
  // =====================================================

  useEffect(() => {
    if (!authUserId) return;

    console.log(
      "SUBSCRIBING APPROVAL REALTIME:",
      authUserId
    );

    const channel = supabase
      .channel(`user-approval-${authUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${authUserId}`,
        },
        async (payload) => {
          const updatedProfile = payload.new as {
            approval_status?: string;
          };

          const newStatus =
            updatedProfile.approval_status;

          if (!newStatus) return;

          console.log(
            "APPROVAL STATUS UPDATED:",
            newStatus
          );

          // Update status di context.
          setUser((previous) => {
            if (!previous) return previous;

            return {
              ...previous,
              approvalStatus: newStatus,
            };
          });

          // Jika admin menyetujui atau mencabut approval,
          // navigasi pengguna berubah otomatis.
          navigateByApproval(newStatus);
        }
      )
      .subscribe((status) => {
        console.log(
          "APPROVAL REALTIME STATUS:",
          status
        );
      });

    return () => {
      console.log(
        "UNSUBSCRIBING APPROVAL REALTIME:",
        authUserId
      );

      supabase.removeChannel(channel);
    };
  }, [authUserId, navigateByApproval]);

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async ({
    role,
    identifier,
    password,
  }: LoginInput) => {
    if (!identifier.trim() || !password) {
      throw new Error(
        "Periksa identitas dan password."
      );
    }

    const { data, error } =
      await supabase.functions.invoke(
        "login-with-lock",
        {
          body: {
            action: "login",
            role: roleToDb(role),
            identifier: identifier.trim(),
            password,
          },
        }
      );

    if (error) {
      console.error("LOGIN FUNCTION ERROR:", error);

      throw new Error(
        "Layanan login tidak dapat dihubungi. Silakan coba kembali."
      );
    }

    if (!data?.ok) {
      const loginError = new Error(
        data?.message ??
          "Login gagal. Periksa kembali data kamu."
      ) as LoginResultError;

      loginError.code = data?.code;

      loginError.retryAfter = Number(
        data?.retryAfter ?? 0
      );

      loginError.remainingAttempts = Number(
        data?.remainingAttempts ?? 0
      );

      throw loginError;
    }

    if (
      !data.access_token ||
      !data.refresh_token
    ) {
      throw new Error(
        "Sesi login tidak berhasil diterima."
      );
    }

    // Simpan session hasil autentikasi server.
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      throw new Error(
        "Sesi login tidak ditemukan."
      );
    }

    const profile = await loadProfile(
      sessionData.session
    );

    if (!profile) {
      await supabase.auth.signOut();

      throw new Error(
        "Profil tidak ditemukan. Silakan hubungi administrator."
      );
    }

    if (profile.role !== role) {
      await supabase.auth.signOut();

      throw new Error(
        "Role akun tidak sesuai pilihan."
      );
    }

    setAuthUserId(sessionData.session.user.id);
    setUser(profile);

    // Langsung arahkan berdasarkan approval.
    navigateByApproval(profile.approvalStatus);
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const register = async ({
    role,
    identifier,
    password,
    name,
    email,
  }: RegisterInput) => {
    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedIdentifier =
      identifier.trim();

    if (!name.trim()) {
      throw new Error("Nama lengkap wajib diisi.");
    }

    if (!normalizedEmail) {
      throw new Error("Email wajib diisi.");
    }

    if (
      role !== "Umum" &&
      !normalizedIdentifier
    ) {
      throw new Error("NPM/NIDN wajib diisi.");
    }

    if (password.length < 8) {
      throw new Error(
        "Password minimal 8 karakter."
      );
    }

    const redirectUrl = Linking.createURL(
      "auth/callback",
      {
        queryParams: {
          role,
        },
      }
    );

    const { data, error } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name.trim(),
            role: roleToDb(role),

            identifier:
              role === "Umum"
                ? null
                : normalizedIdentifier,
          },
        },
      });

    if (error) throw error;

    // Jika Supabase langsung memberikan session,
    // muat profil dan navigasikan sesuai approval.
    if (data.session) {
      const profile = await loadProfile(
        data.session
      );

      setAuthUserId(data.session.user.id);
      setUser(profile);

      if (profile) {
        navigateByApproval(profile.approvalStatus);
      }
    }
  };

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const updateProfile: AuthValue["updateProfile"] =
    async (patch) => {
      if (!user) return;

      const { data: authData } =
        await supabase.auth.getUser();

      if (!authData.user) {
        throw new Error(
          "Sesi login tidak ditemukan."
        );
      }

      const updates: Record<string, unknown> = {};

      if (patch.name !== undefined) {
        updates.full_name = patch.name;
      }

      if (patch.email !== undefined) {
        updates.email = patch.email;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", authData.user.id);

      if (error) throw error;

      setUser({
        ...user,
        ...patch,
      });
    };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setAuthUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth harus dipakai di dalam AuthProvider"
    );
  }

  return ctx;
}
