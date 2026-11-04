
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

function getKey(legacyName: string, modernName: string) {
  const legacy = Deno.env.get(legacyName);
  if (legacy) return legacy;

  const raw = Deno.env.get(modernName);
  if (!raw) throw new Error(`Missing ${modernName}`);

  const parsed = JSON.parse(raw);
  const key = parsed.default ?? Object.values(parsed)[0];

  if (typeof key !== "string") {
    throw new Error(`Invalid ${modernName}`);
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

const admin = createClient(
  supabaseUrl,
  secretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

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

const headers = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

function genericResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      message:
        "Jika identitas tersebut terdaftar, tautan reset password akan dikirim ke email akun.",
    }),
    {
      status: 200,
      headers,
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers,
      }
    );
  }

  try {
    const body = await req.json();

    const role = String(body.role ?? "")
      .trim()
      .toLowerCase();

    const identifier = String(body.identifier ?? "")
      .trim();

    const redirectTo = String(body.redirectTo ?? "")
      .trim();

    const allowedRoles = [
      "mahasiswa",
      "alumni",
      "dosen",
      "umum",
    ];

    if (
      !allowedRoles.includes(role) ||
      !identifier ||
      !redirectTo
    ) {
      return genericResponse();
    }

    let query = admin
      .from("profiles")
      .select("email")
      .eq("role", role);

    if (role === "umum") {
      query = query.eq(
        "email",
        identifier.toLowerCase()
      );
    } else {
      query = query.eq(
        "identifier",
        identifier
      );
    }

    const { data, error } =
      await query.maybeSingle();

    if (error) {
      console.error(
        "FORGOT PASSWORD LOOKUP ERROR:",
        error
      );

      return genericResponse();
    }

    if (!data?.email) {
      return genericResponse();
    }

    // Email dikirim oleh Supabase Auth.
    // Email asli tidak dikembalikan ke aplikasi.
    const { error: resetError } =
      await authClient.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo,
        }
      );

    if (resetError) {
      console.error(
        "RESET PASSWORD EMAIL ERROR:",
        resetError
      );
    }

    return genericResponse();

  } catch (error) {
    console.error(
      "FORGOT PASSWORD FUNCTION ERROR:",
      error
    );

    return genericResponse();
  }
});
