import { requireSupabase } from "@/lib/supabase";

export type SchemaMenuType = "M" | "S" | "P";

export type SchemaRow = {
  itemid: number;
  menuid: string;
  menuname: string;
  menucmd: string | null;
  objectcode: string | null;
  menutype: SchemaMenuType;
  menuicon: string | null;
  udfmaintained: boolean;
  created_at: string;
  updated_at: string;
};

export type SaveSchemaInput = {
  menuid: string;
  menuname: string;
  menucmd?: string | null;
  objectcode?: string | null;
  menutype: SchemaMenuType;
  menuicon?: string | null;
  udfmaintained?: boolean;
};

function normalizeSchemaInput(input: SaveSchemaInput) {
  return {
    menuid: input.menuid.trim(),
    menuname: input.menuname.trim(),
    menucmd: input.menucmd?.trim() || null,
    objectcode: input.objectcode?.trim() || null,
    menutype: input.menutype,
    menuicon: input.menuicon?.trim() || null,
    udfmaintained: Boolean(input.udfmaintained),
  };
}

export async function listSchemas(search = ""): Promise<SchemaRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("schemas")
    .select("itemid,menuid,menuname,menucmd,objectcode,menutype,menuicon,udfmaintained,created_at,updated_at")
    .order("itemid", { ascending: true });

  if (q) {
    query = query.or(
      `menuid.ilike.%${q}%,menuname.ilike.%${q}%,menucmd.ilike.%${q}%,objectcode.ilike.%${q}%,menuicon.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SchemaRow[];
}

export async function createSchema(input: SaveSchemaInput): Promise<SchemaRow> {
  const supabase = requireSupabase();
  const payload = normalizeSchemaInput(input);
  const { data, error } = await supabase.from("schemas").insert(payload).select("*").single();
  if (error) throw error;
  return data as SchemaRow;
}

export async function updateSchema(itemid: number, input: SaveSchemaInput): Promise<SchemaRow> {
  const supabase = requireSupabase();
  const payload = normalizeSchemaInput(input);
  const { data, error } = await supabase.from("schemas").update(payload).eq("itemid", itemid).select("*").single();
  if (error) throw error;
  return data as SchemaRow;
}

export async function deleteSchema(itemid: number): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("schemas").delete().eq("itemid", itemid);
  if (error) throw error;
}
