import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = {
  businessId: string;
  branchId?: string | null;
  roleId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  employeeCode?: string | null;
  status: "active" | "inactive" | "suspended";
  hiredAt?: string | null;
  userId: string;
  loginEmail: string;
  loginPassword: string;
  membershipRole: "admin" | "cashier";
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(500, { error: "Missing Supabase env for function." });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse(401, { error: "Missing Authorization header." });

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerUserData, error: callerUserError } = await callerClient.auth.getUser();
    if (callerUserError || !callerUserData.user) {
      return jsonResponse(401, { error: "Unauthorized request." });
    }
    const callerUserId = callerUserData.user.id;

    const payload = (await req.json()) as Partial<Payload>;
    if (
      !payload.businessId ||
      !payload.firstName ||
      !payload.lastName ||
      !payload.userId ||
      !payload.loginEmail ||
      !payload.loginPassword ||
      !payload.membershipRole
    ) {
      return jsonResponse(400, { error: "Missing required fields." });
    }

    if (payload.membershipRole !== "admin" && payload.membershipRole !== "cashier") {
      return jsonResponse(400, { error: "Invalid membershipRole." });
    }

    const { data: ownerBusiness, error: ownerBusinessError } = await adminClient
      .from("businesses")
      .select("id")
      .eq("id", payload.businessId)
      .eq("owner_user_id", callerUserId)
      .maybeSingle();
    if (ownerBusinessError) return jsonResponse(400, { error: ownerBusinessError.message });

    let isAllowed = Boolean(ownerBusiness);
    if (!isAllowed) {
      const { data: callerMembership, error: callerMembershipError } = await adminClient
        .from("user_memberships")
        .select("role")
        .eq("user_id", callerUserId)
        .eq("business_id", payload.businessId)
        .in("role", ["superadmin", "admin"])
        .maybeSingle();
      if (callerMembershipError) return jsonResponse(400, { error: callerMembershipError.message });
      isAllowed = Boolean(callerMembership);
    }

    if (!isAllowed) {
      return jsonResponse(403, { error: "You are not allowed to manage staff for this business." });
    }

    const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: payload.loginEmail,
      password: payload.loginPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${payload.firstName} ${payload.lastName}`,
        user_id: payload.userId,
        business_id: payload.businessId,
      },
    });
    if (createAuthError || !createdAuth.user) {
      return jsonResponse(400, { error: createAuthError?.message ?? "Failed to create auth user." });
    }

    const authUserId = createdAuth.user.id;

    const { error: membershipError } = await adminClient.from("user_memberships").insert({
      user_id: authUserId,
      business_id: payload.businessId,
      branch_id: payload.branchId ?? null,
      role: payload.membershipRole,
    });
    if (membershipError) {
      await adminClient.auth.admin.deleteUser(authUserId);
      return jsonResponse(400, { error: membershipError.message });
    }

    const { data: staffData, error: staffError } = await adminClient
      .from("staff_members")
      .insert({
        business_id: payload.businessId,
        branch_id: payload.branchId ?? null,
        role_id: payload.roleId ?? null,
        auth_user_id: authUserId,
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email ?? payload.loginEmail,
        phone: payload.phone ?? null,
        employee_code: payload.employeeCode ?? payload.userId,
        status: payload.status ?? "active",
        hired_at: payload.hiredAt ?? null,
        created_by: callerUserId,
      })
      .select("id")
      .single();

    if (staffError) {
      await adminClient.from("user_memberships").delete().eq("user_id", authUserId).eq("business_id", payload.businessId);
      await adminClient.auth.admin.deleteUser(authUserId);
      return jsonResponse(400, { error: staffError.message });
    }

    return jsonResponse(200, {
      staffId: staffData.id,
      authUserId,
      loginEmail: payload.loginEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected function error.";
    return jsonResponse(500, { error: message });
  }
});
