import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the user has biometric credentials registered
    const { data: creds, error: credError } = await supabase
      .from("staff_biometric_credentials")
      .select("id")
      .eq("user_id", user_id)
      .limit(1);

    if (credError || !creds || creds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No biometric credentials found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a session for the user using admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: "", // We'll use a different approach
    });

    // Use signInWithPassword won't work without password.
    // Instead, create a custom JWT or use admin.getUserById + generate session
    // The cleanest approach: use admin API to get user, then create a session

    // Get user details
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(user_id);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link and extract the token for session creation
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email!,
      });

    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ error: "Failed to generate session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the OTP to get actual tokens
    const { data: sessionData, error: verifyError } =
      await supabase.auth.verifyOtp({
        token_hash: linkData.properties?.hashed_token!,
        type: "magiclink",
      });

    if (verifyError || !sessionData?.session) {
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_used_at on the credential
    await supabase
      .from("staff_biometric_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", user_id);

    return new Response(
      JSON.stringify({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
