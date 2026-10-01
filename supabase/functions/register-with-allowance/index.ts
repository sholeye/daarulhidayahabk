import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const hashKey = async (key: string) => {
  const bytes = new TextEncoder().encode(key.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return respond(405, { message: "Method not allowed." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(500, { message: "Signup service is not configured." });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const role = body.role;
    const allowanceKey =
      typeof body.allowanceKey === "string" ? body.allowanceKey : "";

    if (
      !email ||
      !fullName ||
      password.length < 6 ||
      !["parent", "instructor"].includes(role) ||
      !allowanceKey
    ) {
      return respond(400, {
        message: "Enter your details and a valid school allowance key.",
      });
    }

    const keyHash = await hashKey(allowanceKey);
    const { data: keyIsValid, error: keyError } = await adminClient.rpc(
      "allowance_signup_key_is_valid",
      { _key_hash: keyHash, _allowed_role: role },
    );
    if (keyError)
      return respond(503, {
        message: "Signup verification is temporarily unavailable.",
      });
    if (!keyIsValid)
      return respond(400, {
        message:
          "This allowance key is invalid, already used, or intended for another role.",
      });

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "learner" },
      });
    if (createError || !created.user) {
      return respond(400, {
        message: createError?.message || "Unable to create account.",
      });
    }

    const { data: redeemed, error: redeemError } = await adminClient.rpc(
      "redeem_signup_allowance_key",
      { _key_hash: keyHash, _allowed_role: role, _user_id: created.user.id },
    );
    if (redeemError || !redeemed) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return respond(409, {
        message:
          "This allowance key has just been used or revoked. Request a new key from the school.",
      });
    }

    return respond(200, {
      success: true,
      message: "Account created. You can now sign in.",
    });
  } catch {
    return respond(400, { message: "Invalid signup request." });
  }
});
