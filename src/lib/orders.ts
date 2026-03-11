import { requireSupabase } from "@/lib/supabase";

export type OrderStatus = "pending" | "processing" | "completed" | "refunded" | "cancelled";
export type OrderPaymentMethod = "cash" | "card" | "qr" | "bank_transfer" | "other";

export type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  payment_method: OrderPaymentMethod;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  item_count: number;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  item_id: string | null;
  item_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CreateOrderItemInput = {
  itemId: string | null;
  itemName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderInput = {
  businessId: string;
  branchId?: string | null;
  customerName?: string | null;
  paymentMethod: OrderPaymentMethod;
  status?: OrderStatus;
  notes?: string | null;
  discountAmount?: number;
  items: CreateOrderItemInput[];
};

function formatOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 900 + 100);
  return `ORD-${y}${m}${d}-${time}${rand}`;
}

export async function listOrders(businessId: string, search = "", status: "all" | OrderStatus = "all"): Promise<OrderRow[]> {
  const supabase = requireSupabase();
  const q = search.trim();

  let query = supabase
    .from("orders")
    .select("id,order_number,customer_name,payment_method,status,subtotal,discount_amount,total_amount,notes,created_at,order_items(count)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,notes.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    order_number: row.order_number,
    customer_name: row.customer_name,
    payment_method: row.payment_method,
    status: row.status,
    subtotal: Number(row.subtotal ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    total_amount: Number(row.total_amount ?? 0),
    notes: row.notes,
    created_at: row.created_at,
    item_count: Number(row.order_items?.[0]?.count ?? 0),
  }));
}

export async function listOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("order_items")
    .select("id,order_id,item_id,item_name,sku,quantity,unit_price,line_total")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    order_id: row.order_id,
    item_id: row.item_id,
    item_name: row.item_name,
    sku: row.sku,
    quantity: Number(row.quantity ?? 0),
    unit_price: Number(row.unit_price ?? 0),
    line_total: Number(row.line_total ?? 0),
  }));
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const supabase = requireSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const cleanedItems = input.items
    .filter((item) => item.quantity > 0 && item.unitPrice >= 0 && item.itemName.trim())
    .map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName.trim(),
      sku: item.sku?.trim() || null,
      quantity: Math.trunc(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.unitPrice) * Math.trunc(item.quantity),
    }));

  if (!cleanedItems.length) {
    throw new Error("At least one order item is required.");
  }

  const subtotal = cleanedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = Math.max(0, Number(input.discountAmount ?? 0));
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const orderNumber = formatOrderNumber();
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      business_id: input.businessId,
      branch_id: input.branchId ?? null,
      order_number: orderNumber,
      customer_name: input.customerName?.trim() || null,
      payment_method: input.paymentMethod,
      status: input.status ?? "completed",
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      notes: input.notes?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (orderError) throw orderError;

  const orderId = orderData.id as string;
  const { error: itemsError } = await supabase.from("order_items").insert(
    cleanedItems.map((item) => ({
      order_id: orderId,
      business_id: input.businessId,
      item_id: item.itemId,
      item_name: item.itemName,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    })),
  );
  if (itemsError) throw itemsError;

  return orderId;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw error;
}
