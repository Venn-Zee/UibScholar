
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

function getKey(
  legacyName: string,
  modernName: string
): string {
  const legacy = Deno.env.get(legacyName);

  if (legacy) return legacy;

  const raw = Deno.env.get(modernName);

  if (!raw) {
    throw new Error(`Missing ${legacyName}/${modernName}`);
  }

  const parsed = JSON.parse(raw);
  const key = parsed.default ?? Object.values(parsed)[0];

  if (typeof key !== "string") {
    throw new Error(`Invalid key: ${modernName}`);
  }

  return key;
}

const secretKey = getKey(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEYS"
);

const publishableKey = getKey(
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEYS"
);

const supabaseAdmin = createClient(
  supabaseUrl,
  secretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 60;
const LOCK_SECONDS = 60;

const headers = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

async function createRateKey(value: string) {
  const encoder = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(value)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

async function getLockStatus(rateKey: string) {
  const { data, error } = await supabaseAdmin
    .from("login_rate_limits")
    .select("failed_attempts, locked_until")
    .eq("rate_key", rateKey)
    .maybeSingle();

  if (error) throw error;

  if (!data?.locked_until) {
    return {
      locked: false,
      retryAfter: 0,
    };
  }

  const retryAfter = Math.ceil(
    (new Date(data.locked_until).getTime() -
      Date.now()) / 1000
  );

  return {
    locked: retryAfter > 0,
    retryAfter: Math.max(0, retryAfter),
  };
}

async function registerFailure(rateKey: string) {
  const { data, error } = await supabaseAdmin.rpc(
    "register_login_failure",
    {
      p_rate_key: rateKey,
      p_max_attempts: MAX_ATTEMPTS,
      p_window_seconds: WINDOW_SECONDS,
      p_lock_seconds: LOCK_SECONDS,
    }
  );

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("Unable to record login attempt.");
  }

  return {
    attempts: Number(result.failed_attempts),
    locked: Boolean(result.is_locked),
    retryAfter: result.locked_until
      ? Math.max(
          0,
          Math.ceil(
            (new Date(result.locked_until).getTime() -
              Date.now()) / 1000
          )
        )
      : 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({
      ok: false,
      message: "Method not allowed.",
    }, 405);
  }

  try {
    const body = await req.json();

    const action = String(body.action ?? "login");

    const role = String(body.role ?? "")
      .trim()
      .toLowerCase();

    const identifier = String(body.identifier ?? "")
      .trim()
      .toLowerCase();

    const password = String(body.password ?? "");

    const allowedRoles = [
      "mahasiswa",
      "alumni",
      "dosen",
      "umum",
    ];

    if (
      !allowedRoles.includes(role) ||
      !identifier ||
      !["login", "status"].includes(action)
    ) {
      return jsonResponse({
        ok: false,
        code: "INVALID_REQUEST",
        message: "Permintaan login tidak valid.",
      }, 400);
    }

    // Kunci berlaku untuk kombinasi role, identitas, dan IP.
    const clientIp = getClientIp(req);

    const rateKey = await createRateKey(
      `${role}|${identifier}|${clientIp}`
    );

    // Cek status lock sebelum memproses password.
    const lockStatus = await getLockStatus(rateKey);

    if (lockStatus.locked) {
      return jsonResponse({
        ok: false,
        code: "LOGIN_LOCKED",
        message: "Form login terkunci sementara.",
        retryAfter: lockStatus.retryAfter,
      });
    }

    // Dipakai aplikasi saat membuka halaman atau
    // saat identitas pada form berubah.
    if (action === "status") {
      return jsonResponse({
        ok: true,
        locked: false,
      });
    }

    if (!password) {
      return jsonResponse({
        ok: false,
        code: "INVALID_REQUEST",
        message: "Password wajib diisi.",
      }, 400);
    }

    // Cari email berdasarkan role dan identitas.
    let query = supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("role", role);

    if (role === "umum") {
      query = query.eq("email", identifier);
    } else {
      query = query.eq("identifier", identifier);
    }

    const { data: profile, error: profileError } =
      await query.maybeSingle();

    if (profileError) {
      console.error(
        "PROFILE LOOKUP ERROR:",
        profileError
      );
    }

    let session: {
      access_token: string;
      refresh_token: string;
    } | null = null;

    if (!profileError && profile?.email) {
      // Client sementara untuk memverifikasi password.
      const authClient = createClient(
        supabaseUrl,
        publishableKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error: authError } =
        await authClient.auth.signInWithPassword({
          email: profile.email,
          password,
        });

      if (!authError && authData.session) {
        session = {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        };
      }
    }

    // Identitas tidak ditemukan atau password salah.
    if (!session) {
      const failure = await registerFailure(rateKey);

      if (failure.locked) {
        return jsonResponse({
          ok: false,
          code: "LOGIN_LOCKED",
          message:
            "Terlalu banyak percobaan login. Form dikunci sementara.",
          retryAfter: failure.retryAfter,
        });
      }

      return jsonResponse({
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "Identitas atau password tidak valid.",
        remainingAttempts: Math.max(
          0,
          MAX_ATTEMPTS - failure.attempts
        ),
      });
    }

    // Password benar dan tidak sedang dalam masa lock.
    // Bersihkan hitungan untuk percobaan berikutnya.
    const { error: clearError } = await supabaseAdmin
      .from("login_rate_limits")
      .delete()
      .eq("rate_key", rateKey);

    if (clearError) {
      console.error(
        "CLEAR LOGIN ATTEMPTS ERROR:",
        clearError
      );
    }

    return jsonResponse({
      ok: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

  } catch (error) {
    console.error("LOGIN WITH LOCK ERROR:", error);

    return jsonResponse({
      ok: false,
      code: "SERVER_ERROR",
      message:
        "Layanan login sedang mengalami gangguan. Silakan coba kembali.",
    }, 500);
  }
});
