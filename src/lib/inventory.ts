import { requireSupabase } from "@/lib/supabase";

export type InventoryItemRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string | null;
  photo_url?: string | null;
  unit_price: number;
  reorder_level: number;
  quantity_in: number;
  quantity_out: number;
  current_stock: number;
};

type StockTotalRow = {
  item_id: string;
  quantity_in: number;
  quantity_out: number;
  current_stock: number;
};

export type CreateItemInput = {
  businessId: string;
  branchId?: string | null;
  name: string;
  sku: string;
  category: string;
  supplier?: string | null;
  unitPrice: number;
  reorderLevel: number;
  initialQuantity?: number;
  initialStockNotes?: string | null;
  photoUrl?: string | null;
};

export type UpdateItemInput = {
  businessId: string;
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier?: string | null;
  unitPrice: number;
  reorderLevel: number;
  photoUrl?: string | null;
};

export type StockMovementRow = {
  id: string;
  created_at: string;
  movement_type: "in" | "out";
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  item_id: string;
  item_name: string;
  item_sku: string;
  created_by: string | null;
};

export type CreateStockMovementInput = {
  businessId: string;
  branchId?: string | null;
  itemId: string;
  movementType: "in" | "out";
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
};

export async function listInventoryItems(businessId: string, search = ""): Promise<InventoryItemRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("items")
    .select("id,name,sku,category,supplier,photo_url,unit_price,reorder_level")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%,supplier.ilike.%${q}%`);
  }

  const { data: baseRows, error: baseError } = await query;
  if (baseError) throw baseError;
  if (!baseRows || baseRows.length === 0) return [];

  const itemIds = baseRows.map((r) => r.id);
  const { data: totalsRows, error: totalsError } = await supabase
    .from("inventory_item_stock_totals")
    .select("item_id,quantity_in,quantity_out,current_stock")
    .in("item_id", itemIds);

  if (totalsError) throw totalsError;

  const totalsMap = new Map<string, StockTotalRow>();
  (totalsRows ?? []).forEach((row) => {
    totalsMap.set(row.item_id, row as StockTotalRow);
  });

  return baseRows.map((r) => {
    const total = totalsMap.get(r.id);
    return {
      id: r.id,
      name: r.name,
      sku: r.sku,
      category: r.category,
      supplier: r.supplier,
      photo_url: r.photo_url,
      unit_price: Number(r.unit_price ?? 0),
      reorder_level: Number(r.reorder_level ?? 0),
      quantity_in: Number(total?.quantity_in ?? 0),
      quantity_out: Number(total?.quantity_out ?? 0),
      current_stock: Number(total?.current_stock ?? 0),
    };
  });
}

export async function createInventoryItemWithInitialStock(input: CreateItemInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id ?? null;

  const { data: createdItem, error: itemError } = await supabase
    .from("items")
    .insert({
      business_id: input.businessId,
      branch_id: input.branchId ?? null,
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      category: input.category.trim() || "General",
      supplier: input.supplier?.trim() || null,
      photo_url: input.photoUrl?.trim() || null,
      unit_price: input.unitPrice,
      reorder_level: input.reorderLevel,
      created_by: userId,
    })
    .select("id")
    .single();

  if (itemError) throw itemError;

  const initialQty = Number(input.initialQuantity ?? 0);
  if (Number.isInteger(initialQty) && initialQty > 0) {
    const { error: stockError } = await supabase.from("stock_movements").insert({
      item_id: createdItem.id,
      business_id: input.businessId,
      branch_id: input.branchId ?? null,
      movement_type: "in",
      quantity: initialQty,
      reference_type: null,
      reference_id: null,
      notes: input.initialStockNotes?.trim() || "Initial stock on item creation",
      created_by: userId,
    });

    if (stockError) throw stockError;
  }

  return createdItem.id;
}

export async function updateInventoryItem(input: UpdateItemInput): Promise<void> {
  const supabase = requireSupabase();

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    sku: input.sku.trim().toUpperCase(),
    category: input.category.trim() || "General",
    supplier: input.supplier?.trim() || null,
    unit_price: input.unitPrice,
    reorder_level: input.reorderLevel,
    photo_url: input.photoUrl?.trim() || null,
  };

  const { error } = await supabase
    .from("items")
    .update(payload)
    .eq("id", input.id);

  if (error) throw error;
}

export async function deactivateInventoryItem(itemId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("items").update({ is_active: false }).eq("id", itemId);
  if (error) throw error;
}

export async function listStockMovements(businessId: string, search = ""): Promise<StockMovementRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("stock_movements")
    .select("id,created_at,movement_type,quantity,reference_type,reference_id,notes,item_id,created_by,item:items(name,sku)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (q) {
    query = query.or(`reference_id.ilike.%${q}%,notes.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    movement_type: row.movement_type,
    quantity: Number(row.quantity ?? 0),
    reference_type: row.reference_type,
    reference_id: row.reference_id,
    notes: row.notes,
    item_id: row.item_id,
    item_name: row.item?.name ?? "-",
    item_sku: row.item?.sku ?? "-",
    created_by: row.created_by,
  }));
}

export async function createStockMovement(input: CreateStockMovementInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("stock_movements")
    .insert({
      item_id: input.itemId,
      business_id: input.businessId,
      branch_id: input.branchId ?? null,
      movement_type: input.movementType,
      quantity: input.quantity,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      notes: input.notes ?? null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
