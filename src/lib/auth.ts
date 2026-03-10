import type { Business, BusinessType, UserRole } from "@/contexts/AppContext";
import { requireSupabase } from "@/lib/supabase";

const BUSINESS_TYPES: BusinessType[] = ["restaurant", "rice", "retail", "grocery", "pharmacy", "hardware", "salon"];

function toBusinessType(value: string): BusinessType {
  if (BUSINESS_TYPES.includes(value as BusinessType)) {
    return value as BusinessType;
  }
  return "retail";
}

function toAppRole(role: string): UserRole {
  if (role === "owner") return "owner";
  return role === "cashier" ? "cashier" : "admin";
}

function sanitizeFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");
}

export async function signInWithEmailPassword(email: string, password: string): Promise<{ role: UserRole; business: Business }> {
  const supabase = requireSupabase();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("No user returned by Supabase.");

  const { data: membership, error: membershipError } = await supabase
    .from("user_memberships")
    .select(
      `
      role,
      business:businesses(id,name,type,activation_status),
      branch:branches(id,name,location)
    `
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (membership && membership.role === "owner") {
    return {
      role: "owner",
      business: {
        id: "platform",
        name: "BizPOS Pro",
        type: "retail",
        activationStatus: "active",
        branches: [{ id: "hq", name: "Head Office", location: "Global" }],
      },
    };
  }

  if (!membership || !membership.business) {
    const { data: ownedBusiness, error: ownedBusinessError } = await supabase
      .from("businesses")
      .select("id,name,type,address,activation_status")
      .eq("owner_user_id", authData.user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedBusinessError) throw ownedBusinessError;

    if (ownedBusiness) {
      const { data: existingBranch, error: existingBranchError } = await supabase
        .from("branches")
        .select("id,name,location")
        .eq("business_id", ownedBusiness.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingBranchError) throw existingBranchError;

      let branch = existingBranch;
      if (!branch) {
        const { data: branchInsert, error: branchInsertError } = await supabase
          .from("branches")
          .insert({
            business_id: ownedBusiness.id,
            name: "Main Branch",
            location: ownedBusiness.address || "Main Office",
            is_main: true,
          })
          .select("id,name,location")
          .single();
        if (branchInsertError) throw branchInsertError;
        branch = branchInsert;
      }

      const { error: membershipInsertError } = await supabase.from("user_memberships").insert({
        user_id: authData.user.id,
        business_id: ownedBusiness.id,
        branch_id: branch.id,
        role: "admin",
      });

      if (membershipInsertError) throw membershipInsertError;

      return {
        role: "admin",
        business: {
          id: ownedBusiness.id,
          name: ownedBusiness.name,
          type: toBusinessType(ownedBusiness.type),
          activationStatus: ownedBusiness.activation_status ?? "pending",
          activationKey: `ACT-${ownedBusiness.id.split("-")[0].toUpperCase()}`,
          branches: [{ id: branch.id, name: branch.name, location: branch.location }],
        },
      };
    }

    const inferredName = authData.user.email ? `${authData.user.email.split("@")[0]}'s Business` : "My Business";
    const inferredType = "retail";
    const inferredEmail = authData.user.email || email;

    const { data: createdBusiness, error: createdBusinessError } = await supabase
      .from("businesses")
      .insert({
        name: inferredName,
        type: inferredType,
        email: inferredEmail,
        phone: null,
        address: null,
        owner_user_id: authData.user.id,
        is_configured: false,
        activation_status: "pending",
      })
      .select("id,name,type")
      .single();

    if (createdBusinessError) throw createdBusinessError;

    const { data: createdBranch, error: createdBranchError } = await supabase
      .from("branches")
      .insert({
        business_id: createdBusiness.id,
        name: "Main Branch",
        location: "Main Office",
        is_main: true,
      })
      .select("id,name,location")
      .single();

    if (createdBranchError) throw createdBranchError;

    const { error: createdMembershipError } = await supabase.from("user_memberships").insert({
      user_id: authData.user.id,
      business_id: createdBusiness.id,
      branch_id: createdBranch.id,
      role: "admin",
    });

    if (createdMembershipError) throw createdMembershipError;

    return {
      role: "admin",
      business: {
        id: createdBusiness.id,
        name: createdBusiness.name,
        type: toBusinessType(createdBusiness.type),
        activationStatus: "pending",
        activationKey: `ACT-${createdBusiness.id.split("-")[0].toUpperCase()}`,
        branches: [{ id: createdBranch.id, name: createdBranch.name, location: createdBranch.location }],
      },
    };
  }

  const biz = Array.isArray(membership.business) ? membership.business[0] : membership.business;
  const branchRaw = Array.isArray(membership.branch) ? membership.branch[0] : membership.branch;
  const branchRow = branchRaw ?? { id: "main", name: "Main Branch", location: "N/A" };
  const business: Business = {
    id: biz.id,
    name: biz.name,
    type: toBusinessType(biz.type),
    activationStatus: biz.activation_status ?? "pending",
    activationKey: `ACT-${biz.id.split("-")[0].toUpperCase()}`,
    branches: [
      {
        id: branchRow.id,
        name: branchRow.name,
        location: branchRow.location,
      },
    ],
  };

  return {
    role: toAppRole(membership.role),
    business,
  };
}

type RegisterPayload = {
  businessName: string;
  businessType: string;
  location: string;
  email: string;
  phone: string;
  logo: File | null;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
};

export async function registerBusinessOwner(payload: RegisterPayload): Promise<void> {
  const supabase = requireSupabase();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: payload.ownerEmail,
    password: payload.ownerPassword,
    options: {
      data: {
        full_name: payload.ownerName,
      },
    },
  });

  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new Error("Registration failed. User was not created.");

  if (!signUpData.session) {
    throw new Error("Email confirmation is enabled in Supabase. Disable it in Authentication > Providers > Email to save registration immediately.");
  }

  let logoUrl: string | null = null;
  if (payload.logo) {
    const filePath = `${signUpData.user.id}/${Date.now()}-${sanitizeFileName(payload.logo.name)}`;
    const { error: uploadError } = await supabase.storage.from("business-logos").upload(filePath, payload.logo, {
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("business-logos").getPublicUrl(filePath);
    logoUrl = publicUrlData.publicUrl;
  }

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: payload.businessName,
      type: payload.businessType,
      email: payload.email,
      phone: payload.phone || null,
      address: payload.location,
      logo_url: logoUrl,
      owner_user_id: signUpData.user.id,
      is_configured: true,
      activation_status: "pending",
    })
    .select("id")
    .single();

  if (businessError) throw businessError;

  const { data: branchRow, error: branchError } = await supabase
    .from("branches")
    .insert({
      business_id: businessRow.id,
      name: "Main Branch",
      location: payload.location,
      is_main: true,
    })
    .select("id")
    .single();

  if (branchError) throw branchError;

  const { error: membershipError } = await supabase.from("user_memberships").insert({
    user_id: signUpData.user.id,
    business_id: businessRow.id,
    branch_id: branchRow.id,
    role: "admin",
  });

  if (membershipError) throw membershipError;
}

export async function sendPasswordReset(email: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
