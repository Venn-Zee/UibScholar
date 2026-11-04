import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { role, identifier } = await req.json();
    const allowedRoles = ["mahasiswa", "alumni", "dosen"];
    const normalizedRole = String(role ?? "").toLowerCase();
    const normalizedIdentifier = String(identifier ?? "").trim();
    if (!allowedRoles.includes(normalizedRole) || !normalizedIdentifier) {
      return Response.json({ error: "Invalid credentials" }, { status: 400, headers: corsHeaders });
    }

    // student_id stores NPM for Mahasiswa/Alumni and NIDN for Dosen.
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("role", normalizedRole)
      .eq("identifier", normalizedIdentifier)
      .maybeSingle();

    if (error || !data?.email) {
      return Response.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders });
    }
    return Response.json({ email: data.email }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
  }
});
