import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { BillingPanel } from "@/components/super-admin/BillingPanel";
import { BusinessesPanel } from "@/components/super-admin/BusinessesPanel";
import { MenuUserAuthorizationPanel } from "@/components/super-admin/MenuUserAuthorizationPanel";
import { OverviewPanel } from "@/components/super-admin/OverviewPanel";
import { SettingsPanel } from "@/components/super-admin/SettingsPanel";
import { SuperAdminHeader } from "@/components/super-admin/SuperAdminHeader";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { SystemMenuPanel } from "@/components/super-admin/SystemMenuPanel";
import { UsersPanel } from "@/components/super-admin/UsersPanel";
import { BusinessTypePage } from "@/pages/BusinessTypePage";
import type { ActivationStatus, BusinessRow, SuperTab } from "@/components/super-admin/types";

// Simple placeholder for new tabs
function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[26px] border border-slate-700/80 bg-[#1a2436] text-center">
      <p className="text-xl font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default function SuperAdmin() {
  const { logout } = useApp();
  const [tab, setTab] = useState<SuperTab>("overview");
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredBusinesses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.email ?? "").toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q),
    );
  }, [businesses, search]);

  const stats = useMemo(() => {
    const total = businesses.length;
    const active = businesses.filter((b) => b.activation_status === "active").length;
    const pending = businesses.filter((b) => b.activation_status === "pending").length;
    const suspended = businesses.filter((b) => b.activation_status === "suspended").length;
    return { total, active, pending, suspended, totalUsers: businesses.length * 8 };
  }, [businesses]);

  async function loadBusinesses() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: loadError } = await supabase
        .from("businesses")
        .select("id,name,type,email,phone,activation_status,created_at")
        .order("created_at", { ascending: false });
      if (loadError) throw loadError;
      setBusinesses((data ?? []) as BusinessRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load businesses.");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: ActivationStatus) {
    if (!supabase) return;
    try {
      setSavingId(id);
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ activation_status: status })
        .eq("id", id);
      if (updateError) throw updateError;
      setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, activation_status: status } : b)));
    } catch (e: any) {
      setError(e?.message ?? "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#06101f]">
      <SuperAdminSidebar tab={tab} onTabChange={setTab} onLogout={logout} />

      <section className="flex min-w-0 flex-1 flex-col">
        <SuperAdminHeader />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {error && (
            <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          {tab === "overview" && (
            <OverviewPanel
              stats={stats}
              loading={loading}
              businesses={businesses}
              onRefresh={loadBusinesses}
              onActivate={setStatus}
              savingId={savingId}
            />
          )}
          {tab === "businesses" && (
            <BusinessesPanel
              rows={filteredBusinesses}
              loading={loading}
              savingId={savingId}
              onActivate={setStatus}
            />
          )}
          {tab === "users" && <UsersPanel />}
          {tab === "businesstype" && <BusinessTypePage />}
          {tab === "systemmenu" && <SystemMenuPanel />}
          {tab === "menuuserauth" && <MenuUserAuthorizationPanel />}
          {tab === "billing" && (
            <BillingPanel totalBusinesses={stats.total} activeBusinesses={stats.active} />
          )}
          {tab === "notifications" && (
            <PlaceholderPanel title="Notifications" description="Platform-wide alerts and notification management coming soon." />
          )}
          {tab === "integrations" && (
            <PlaceholderPanel title="Integrations" description="Third-party service integrations and webhooks coming soon." />
          )}
          {tab === "settings" && <SettingsPanel />}
        </main>
      </section>
    </div>
  );
}
