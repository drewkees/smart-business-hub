import { requireSupabase } from "@/lib/supabase";

export type ItemCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type CreateItemCategoryInput = {
  businessId: string;
  name: string;
  description?: string | null;
};

export async function listItemCategories(businessId: string, search = ""): Promise<ItemCategoryRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("item_categories")
    .select("id,name,description,is_active")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ItemCategoryRow[];
}

export async function createItemCategory(input: CreateItemCategoryInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("item_categories")
    .insert({
      business_id: input.businessId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
