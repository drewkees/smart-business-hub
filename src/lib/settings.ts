import { requireSupabase } from "@/lib/supabase";

export type BusinessProfileSettings = {
  id: string;
  name: string;
  type: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
};

export type BusinessSettingsRow = {
  business_id: string;
  notification_low_stock: boolean;
  notification_orders: boolean;
  notification_reports: boolean;
  notification_channel: "inapp" | "email" | "both";
  require_pin_on_sale: boolean;
  two_factor_required: boolean;
  session_timeout_minutes: number;
  theme_mode: "light" | "dark" | "system";
  accent_color: string;
  compact_mode: boolean;
  tax_rate: number;
  service_charge_rate: number;
  allow_manual_discount: boolean;
  receipt_footer: string | null;
};

export type UpsertBusinessSettingsInput = Partial<Omit<BusinessSettingsRow, "business_id">>;

const DEFAULT_SETTINGS: Omit<BusinessSettingsRow, "business_id"> = {
  notification_low_stock: true,
  notification_orders: true,
  notification_reports: false,
  notification_channel: "inapp",
  require_pin_on_sale: false,
  two_factor_required: false,
  session_timeout_minutes: 60,
  theme_mode: "system",
  accent_color: "blue",
  compact_mode: false,
  tax_rate: 0,
  service_charge_rate: 0,
  allow_manual_discount: true,
  receipt_footer: "Thank you for your purchase.",
};

export async function getBusinessProfile(businessId: string): Promise<BusinessProfileSettings> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("businesses")
    .select("id,name,type,address,email,phone,logo_url")
    .eq("id", businessId)
    .single();

  if (error) throw error;
  return data as BusinessProfileSettings;
}

export async function updateBusinessProfile(
  businessId: string,
  input: Partial<Omit<BusinessProfileSettings, "id">>,
): Promise<void> {
  const supabase = requireSupabase();
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.type !== undefined) payload.type = input.type;
  if (input.address !== undefined) payload.address = input.address;
  if (input.email !== undefined) payload.email = input.email;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.logo_url !== undefined) payload.logo_url = input.logo_url;

  const { error } = await supabase.from("businesses").update(payload).eq("id", businessId);
  if (error) throw error;
}

export async function getBusinessSettings(businessId: string): Promise<BusinessSettingsRow> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id,notification_low_stock,notification_orders,notification_reports,notification_channel,require_pin_on_sale,two_factor_required,session_timeout_minutes,theme_mode,accent_color,compact_mode,tax_rate,service_charge_rate,allow_manual_discount,receipt_footer",
    )
    .eq("id", businessId)
    .single();

  if (error) throw error;

  return {
    business_id: businessId,
    notification_low_stock: data.notification_low_stock ?? DEFAULT_SETTINGS.notification_low_stock,
    notification_orders: data.notification_orders ?? DEFAULT_SETTINGS.notification_orders,
    notification_reports: data.notification_reports ?? DEFAULT_SETTINGS.notification_reports,
    notification_channel: data.notification_channel ?? DEFAULT_SETTINGS.notification_channel,
    require_pin_on_sale: data.require_pin_on_sale ?? DEFAULT_SETTINGS.require_pin_on_sale,
    two_factor_required: data.two_factor_required ?? DEFAULT_SETTINGS.two_factor_required,
    session_timeout_minutes: data.session_timeout_minutes ?? DEFAULT_SETTINGS.session_timeout_minutes,
    theme_mode: data.theme_mode ?? DEFAULT_SETTINGS.theme_mode,
    accent_color: data.accent_color ?? DEFAULT_SETTINGS.accent_color,
    compact_mode: data.compact_mode ?? DEFAULT_SETTINGS.compact_mode,
    tax_rate: Number(data.tax_rate ?? DEFAULT_SETTINGS.tax_rate),
    service_charge_rate: Number(data.service_charge_rate ?? DEFAULT_SETTINGS.service_charge_rate),
    allow_manual_discount: data.allow_manual_discount ?? DEFAULT_SETTINGS.allow_manual_discount,
    receipt_footer: data.receipt_footer ?? DEFAULT_SETTINGS.receipt_footer,
  };
}

export async function upsertBusinessSettings(businessId: string, input: UpsertBusinessSettingsInput): Promise<void> {
  const supabase = requireSupabase();
  const payload: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(input)) {
    payload[k] = v;
  }

  const { error } = await supabase.from("businesses").update(payload).eq("id", businessId);
  if (error) throw error;
}
