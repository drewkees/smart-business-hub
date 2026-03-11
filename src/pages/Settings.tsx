import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp, type BusinessType } from "@/contexts/AppContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import {
  getBusinessProfile,
  getBusinessSettings,
  updateBusinessProfile,
  upsertBusinessSettings,
  type BusinessSettingsRow,
} from "@/lib/settings";
import {
  Store,
  Bell,
  Lock,
  Palette,
  Receipt,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsSectionId = "business" | "notifications" | "security" | "appearance" | "pos";

type BusinessProfileForm = {
  name: string;
  type: BusinessType;
  address: string;
  email: string;
  phone: string;
  logo_url: string;
};

type BusinessSettingsForm = Omit<BusinessSettingsRow, "business_id">;

const DEFAULT_SETTINGS: BusinessSettingsForm = {
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

const SECTION_ITEMS: Array<{ id: SettingsSectionId; label: string; desc: string; icon: any; color: string }> = [
  { id: "business", icon: Store, label: "Business Profile", desc: "Name, address, logo, business type", color: "from-blue-500 to-indigo-500" },
  { id: "notifications", icon: Bell, label: "Notifications", desc: "Low stock alerts, order updates, reports", color: "from-amber-500 to-orange-400" },
  { id: "security", icon: Lock, label: "Security", desc: "Password policy, 2FA, session settings", color: "from-rose-500 to-red-400" },
  { id: "appearance", icon: Palette, label: "Appearance", desc: "Theme, color scheme, layout preferences", color: "from-teal-500 to-cyan-400" },
  { id: "pos", icon: Receipt, label: "POS Configuration", desc: "Receipt format, tax settings, payment methods", color: "from-slate-500 to-zinc-400" },
];

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function toBusinessType(v: string): BusinessType {
  if (v in BUSINESS_TYPE_CONFIG) return v as BusinessType;
  return "retail";
}

export default function Settings() {
  const { currentBusiness, setCurrentBusiness } = useApp();

  const [active, setActive] = useState<SettingsSectionId>("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<BusinessProfileForm>({
    name: currentBusiness.name,
    type: currentBusiness.type,
    address: currentBusiness.branches[0]?.location ?? "",
    email: "",
    phone: "",
    logo_url: "",
  });

  const [settings, setSettings] = useState<BusinessSettingsForm>(DEFAULT_SETTINGS);

  const isDbMode = useMemo(() => isSupabaseConfigured && isUuid(currentBusiness.id), [currentBusiness.id]);

  useEffect(() => {
    let activeMount = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!isDbMode) {
          if (!activeMount) return;
          setProfile((p) => ({
            ...p,
            name: currentBusiness.name,
            type: currentBusiness.type,
            address: currentBusiness.branches[0]?.location ?? "",
          }));
          setSettings(DEFAULT_SETTINGS);
          return;
        }

        const [profileRow, settingRow] = await Promise.all([
          getBusinessProfile(currentBusiness.id),
          getBusinessSettings(currentBusiness.id),
        ]);

        if (!activeMount) return;

        setProfile({
          name: profileRow.name,
          type: toBusinessType(profileRow.type),
          address: profileRow.address ?? "",
          email: profileRow.email ?? "",
          phone: profileRow.phone ?? "",
          logo_url: profileRow.logo_url ?? "",
        });

        setSettings({
          notification_low_stock: settingRow.notification_low_stock,
          notification_orders: settingRow.notification_orders,
          notification_reports: settingRow.notification_reports,
          notification_channel: settingRow.notification_channel,
          require_pin_on_sale: settingRow.require_pin_on_sale,
          two_factor_required: settingRow.two_factor_required,
          session_timeout_minutes: settingRow.session_timeout_minutes,
          theme_mode: settingRow.theme_mode,
          accent_color: settingRow.accent_color,
          compact_mode: settingRow.compact_mode,
          tax_rate: Number(settingRow.tax_rate ?? 0),
          service_charge_rate: Number(settingRow.service_charge_rate ?? 0),
          allow_manual_discount: settingRow.allow_manual_discount,
          receipt_footer: settingRow.receipt_footer ?? "",
        });
      } catch (e: any) {
        if (activeMount) {
          setError(e?.message ?? "Failed to load settings.");
        }
      } finally {
        if (activeMount) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      activeMount = false;
    };
  }, [currentBusiness.id, currentBusiness.name, currentBusiness.type, currentBusiness.branches, isDbMode]);

  async function saveBusinessProfile() {
    setError(null);
    setSuccess(null);

    const email = profile.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid business email.");
      return;
    }

    try {
      setSaving(true);

      if (isDbMode) {
        await updateBusinessProfile(currentBusiness.id, {
          name: profile.name.trim(),
          type: profile.type,
          address: profile.address.trim() || null,
          email: email || null,
          phone: profile.phone.trim() || null,
          logo_url: profile.logo_url.trim() || null,
        });
      }

      setCurrentBusiness({
        ...currentBusiness,
        name: profile.name.trim() || currentBusiness.name,
        type: profile.type,
        logoUrl: profile.logo_url.trim() || null,
      });

      setSuccess("Business profile updated.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save business profile.");
    } finally {
      setSaving(false);
    }
  }

  function onPickLogo() {
    logoInputRef.current?.click();
  }

  function onRemoveLogo() {
    setProfile((p) => ({ ...p, logo_url: "" }));
  }

  function onLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be 2MB or less.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfile((p) => ({ ...p, logo_url: result }));
      setError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function saveSettingsSection(message: string) {
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      if (isDbMode) {
        await upsertBusinessSettings(currentBusiness.id, settings);
      }
      setSuccess(message);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Settings">
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
        <div className="space-y-4">
          {SECTION_ITEMS.map(({ id, icon: Icon, label, desc, color }) => {
            const selected = active === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "w-full bg-card rounded-2xl p-5 shadow-card border flex items-center gap-4 text-left group transition-all",
                  selected ? "border-primary shadow-primary/30" : "border-border hover:shadow-card-md hover:border-primary/30",
                )}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <div className={cn("w-5 h-5 rounded-full border-2 transition-colors", selected ? "border-primary" : "border-border group-hover:border-primary")} />
              </button>
            );
          })}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-5 md:p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {active === "business" && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Business Profile</h3>
                    <p className="text-sm text-muted-foreground">Update your tenant business details shown across the app.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Business Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Business name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <Select value={profile.type} onValueChange={(v) => setProfile((p) => ({ ...p, type: toBusinessType(v) }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BUSINESS_TYPE_CONFIG).map(([value, cfg]) => (
                            <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        placeholder="business@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+63..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Logo</Label>
                      <div className="rounded-xl border border-border p-3 bg-secondary/20">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={onLogoFileChange}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg border border-dashed border-border bg-card flex items-center justify-center overflow-hidden">
                            {profile.logo_url ? (
                              <img src={profile.logo_url} alt="Business logo" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={onPickLogo}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {profile.logo_url ? "Change Logo" : "Upload Logo"}
                            </button>
                            {profile.logo_url && (
                              <button
                                type="button"
                                onClick={onRemoveLogo}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/20 bg-danger-muted/40 text-danger text-xs font-semibold"
                              >
                                <X className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">PNG, JPG, or WEBP up to 2MB.</p>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Address</Label>
                      <Textarea
                        value={profile.address}
                        onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                        rows={3}
                        placeholder="Business address"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={saveBusinessProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Business Profile"}
                  </button>
                </section>
              )}

              {active === "notifications" && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Choose which business events should notify your team.</p>
                  </div>
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    {[
                      ["Low stock alerts", "notification_low_stock"],
                      ["Order updates", "notification_orders"],
                      ["Daily reports", "notification_reports"],
                    ].map(([label, key]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <p className="text-sm text-foreground">{label}</p>
                        <Switch
                          checked={Boolean(settings[key as keyof BusinessSettingsForm])}
                          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, [key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <Label>Channel</Label>
                    <Select
                      value={settings.notification_channel}
                      onValueChange={(v: "inapp" | "email" | "both") => setSettings((p) => ({ ...p, notification_channel: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inapp">In-app only</SelectItem>
                        <SelectItem value="email">Email only</SelectItem>
                        <SelectItem value="both">In-app and Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveSettingsSection("Notification settings saved.")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Notifications"}
                  </button>
                </section>
              )}

              {active === "security" && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Security</h3>
                    <p className="text-sm text-muted-foreground">Control authentication and cashier safety behavior.</p>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-foreground">Require PIN on each sale</p>
                        <p className="text-xs text-muted-foreground">Cashier must confirm with PIN before completing payment.</p>
                      </div>
                      <Switch
                        checked={settings.require_pin_on_sale}
                        onCheckedChange={(checked) => setSettings((p) => ({ ...p, require_pin_on_sale: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-foreground">Require 2FA for admins</p>
                        <p className="text-xs text-muted-foreground">Enforce 2-factor auth for admin-level users.</p>
                      </div>
                      <Switch
                        checked={settings.two_factor_required}
                        onCheckedChange={(checked) => setSettings((p) => ({ ...p, two_factor_required: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <Label>Session timeout (minutes)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={1440}
                      value={settings.session_timeout_minutes}
                      onChange={(e) => setSettings((p) => ({ ...p, session_timeout_minutes: Math.min(1440, Math.max(5, Number(e.target.value) || 60)) }))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveSettingsSection("Security settings saved.")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Security"}
                  </button>
                </section>
              )}

              {active === "appearance" && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                    <p className="text-sm text-muted-foreground">Set your preferred interface style for this business.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Theme mode</Label>
                      <Select
                        value={settings.theme_mode}
                        onValueChange={(v: "light" | "dark" | "system") => setSettings((p) => ({ ...p, theme_mode: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent color</Label>
                      <Select
                        value={settings.accent_color}
                        onValueChange={(v) => setSettings((p) => ({ ...p, accent_color: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="emerald">Emerald</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="slate">Slate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 max-w-lg">
                    <div>
                      <p className="text-sm text-foreground">Compact mode</p>
                      <p className="text-xs text-muted-foreground">Use denser layout in tables and cards.</p>
                    </div>
                    <Switch checked={settings.compact_mode} onCheckedChange={(checked) => setSettings((p) => ({ ...p, compact_mode: checked }))} />
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveSettingsSection("Appearance settings saved.")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Appearance"}
                  </button>
                </section>
              )}

              {active === "pos" && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">POS Configuration</h3>
                    <p className="text-sm text-muted-foreground">Set taxes, discounts, and receipt behavior.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tax rate (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={settings.tax_rate}
                        onChange={(e) => setSettings((p) => ({ ...p, tax_rate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Service charge (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={settings.service_charge_rate}
                        onChange={(e) => setSettings((p) => ({ ...p, service_charge_rate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 max-w-lg">
                    <div>
                      <p className="text-sm text-foreground">Allow manual discount</p>
                      <p className="text-xs text-muted-foreground">Cashier can apply manual discount during checkout.</p>
                    </div>
                    <Switch
                      checked={settings.allow_manual_discount}
                      onCheckedChange={(checked) => setSettings((p) => ({ ...p, allow_manual_discount: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt footer</Label>
                    <Textarea
                      rows={3}
                      value={settings.receipt_footer ?? ""}
                      onChange={(e) => setSettings((p) => ({ ...p, receipt_footer: e.target.value }))}
                      placeholder="Thank you for your purchase."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveSettingsSection("POS configuration saved.")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save POS Settings"}
                  </button>
                </section>
              )}

              {error && <div className="mt-5 rounded-lg border border-danger/20 bg-danger-muted/40 px-3 py-2 text-sm text-danger">{error}</div>}
              {success && <div className="mt-5 rounded-lg border border-success/20 bg-success-muted/40 px-3 py-2 text-sm text-success">{success}</div>}

              {!isDbMode && (
                <div className="mt-5 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Supabase is not connected to this business yet. Settings are shown in local demo mode.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
