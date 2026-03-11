import { requireSupabase } from "@/lib/supabase";

export type BranchRow = {
  id: string;
  business_id: string;
  name: string;
  location: string;
  is_main: boolean;
  created_at: string;
};

export type CreateBranchInput = {
  businessId: string;
  name: string;
  location: string;
  isMain?: boolean;
};

export type UpdateBranchInput = {
  id: string;
  businessId: string;
  name: string;
  location: string;
  isMain?: boolean;
};

export async function listBranches(businessId: string, search = ""): Promise<BranchRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("branches")
    .select("id,business_id,name,location,is_main,created_at")
    .eq("business_id", businessId)
    .order("is_main", { ascending: false })
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BranchRow[];
}

export async function createBranch(input: CreateBranchInput): Promise<string> {
  const supabase = requireSupabase();

  if (input.isMain) {
    const { error: clearError } = await supabase
      .from("branches")
      .update({ is_main: false })
      .eq("business_id", input.businessId)
      .eq("is_main", true);
    if (clearError) throw clearError;
  }

  const { data, error } = await supabase
    .from("branches")
    .insert({
      business_id: input.businessId,
      name: input.name.trim(),
      location: input.location.trim(),
      is_main: Boolean(input.isMain),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function updateBranch(input: UpdateBranchInput): Promise<void> {
  const supabase = requireSupabase();

  if (input.isMain) {
    const { error: clearError } = await supabase
      .from("branches")
      .update({ is_main: false })
      .eq("business_id", input.businessId)
      .eq("is_main", true)
      .neq("id", input.id);
    if (clearError) throw clearError;
  }

  const { error } = await supabase
    .from("branches")
    .update({
      name: input.name.trim(),
      location: input.location.trim(),
      is_main: Boolean(input.isMain),
    })
    .eq("id", input.id);

  if (error) throw error;
}

export async function deleteBranch(branchId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("branches").delete().eq("id", branchId);
  if (error) throw error;
}

