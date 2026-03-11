import { requireSupabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export type StaffRoleRow = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
};

export type StaffMemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  employee_code: string | null;
  status: "active" | "inactive" | "suspended";
  hired_at: string | null;
  role_id: string | null;
  role_name: string | null;
  branch_id: string | null;
  branch_name: string | null;
};

export type CreateStaffRoleInput = {
  businessId: string;
  name: string;
  code?: string | null;
  description?: string | null;
};

export type CreateStaffMemberInput = {
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
};

export type CreateStaffMemberWithAuthInput = CreateStaffMemberInput & {
  userId: string;
  loginEmail: string;
  loginPassword: string;
  membershipRole: "admin" | "cashier";
};

export type StaffCredentials = {
  email: string;
  password: string;
};

function slugifyBusinessToken(value: string): string {
  const token = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return token || "business";
}

function sanitizeUserId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export function buildStaffLoginCredentials(userId: string, businessName: string, date = new Date()): StaffCredentials {
  const uid = sanitizeUserId(userId);
  const businessToken = slugifyBusinessToken(businessName);
  const year = String(date.getFullYear());
  return {
    email: `${uid}@${businessToken}.local`,
    password: `${businessToken}${year}`,
  };
}

export async function listStaffRoles(businessId: string, search = ""): Promise<StaffRoleRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("staff_roles")
    .select("id,name,code,description,is_active")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as StaffRoleRow[];
}

export async function createStaffRole(input: CreateStaffRoleInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("staff_roles")
    .insert({
      business_id: input.businessId,
      name: input.name.trim(),
      code: input.code?.trim() || null,
      description: input.description?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function listStaffMembers(businessId: string, search = ""): Promise<StaffMemberRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("staff_members")
    .select("id,first_name,last_name,email,phone,employee_code,status,hired_at,role_id,branch_id,role:staff_roles(name),branch:branches(name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,employee_code.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    employee_code: row.employee_code,
    status: row.status,
    hired_at: row.hired_at,
    role_id: row.role_id,
    role_name: row.role?.name ?? null,
    branch_id: row.branch_id,
    branch_name: row.branch?.name ?? null,
  }));
}

export async function createStaffMember(input: CreateStaffMemberInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("staff_members")
    .insert({
      business_id: input.businessId,
      branch_id: input.branchId ?? null,
      role_id: input.roleId ?? null,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      employee_code: input.employeeCode?.trim() || null,
      status: input.status,
      hired_at: input.hiredAt || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function createStaffMemberWithAuth(input: CreateStaffMemberWithAuthInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("No active session found.");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment is not configured.");

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/create-staff-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        businessId: input.businessId,
        branchId: input.branchId ?? null,
        roleId: input.roleId ?? null,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        employeeCode: input.employeeCode ?? null,
        status: input.status,
        hiredAt: input.hiredAt ?? null,
        userId: input.userId,
        loginEmail: input.loginEmail,
        loginPassword: input.loginPassword,
        membershipRole: input.membershipRole,
      }),
    });
  } catch {
    return createStaffMemberWithClientSignUp(input);
  }

  if (!response.ok) {
    let message = "Failed to create staff auth account.";
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {
      // noop
    }
    // If function is unavailable, fallback to client signUp flow.
    if (response.status === 404 || response.status >= 500 || message.toLowerCase().includes("failed to fetch")) {
      return createStaffMemberWithClientSignUp(input);
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return payload.staffId as string;
}

async function createStaffMemberWithClientSignUp(input: CreateStaffMemberWithAuthInput): Promise<string> {
  const supabase = requireSupabase();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment is not configured.");

  // Isolated auth client so admin session in app is not replaced.
  const signupClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `staff-signup-${Date.now()}`,
    },
  });

  const { data: signUpData, error: signUpError } = await signupClient.auth.signUp({
    email: input.loginEmail,
    password: input.loginPassword,
    options: {
      data: {
        full_name: `${input.firstName} ${input.lastName}`,
        user_id: input.userId,
        business_id: input.businessId,
      },
    },
  });
  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new Error("Staff auth user was not created.");
  if (!signUpData.session) {
    throw new Error("Email confirmation is enabled. Disable it to auto-create staff login, or deploy the edge function.");
  }

  // Insert membership as the newly created user (self insert policy).
  const { error: membershipError } = await signupClient.from("user_memberships").insert({
    user_id: signUpData.user.id,
    business_id: input.businessId,
    branch_id: input.branchId ?? null,
    role: input.membershipRole,
  });
  if (membershipError) throw membershipError;

  const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError) throw currentUserError;

  // Insert staff member using current admin account.
  const { data: staffData, error: staffError } = await supabase
    .from("staff_members")
    .insert({
      business_id: input.businessId,
      branch_id: input.branchId ?? null,
      role_id: input.roleId ?? null,
      auth_user_id: signUpData.user.id,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email?.trim() || input.loginEmail,
      phone: input.phone?.trim() || null,
      employee_code: input.employeeCode?.trim() || null,
      status: input.status,
      hired_at: input.hiredAt || null,
      created_by: currentUserData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (staffError) throw staffError;

  return staffData.id;
}
