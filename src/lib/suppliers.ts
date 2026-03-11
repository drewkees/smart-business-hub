import { requireSupabase } from "@/lib/supabase";

export type SupplierRow = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
};

export type CreateSupplierInput = {
  businessId: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export async function listSuppliers(businessId: string, search = ""): Promise<SupplierRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("suppliers")
    .select("id,name,contact_person,email,phone,address,notes,is_active")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,contact_person.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SupplierRow[];
}

export async function createSupplier(input: CreateSupplierInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      business_id: input.businessId,
      name: input.name.trim(),
      contact_person: input.contactPerson?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
