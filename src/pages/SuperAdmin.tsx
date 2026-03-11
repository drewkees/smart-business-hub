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
import type { ActivationStatus, BusinessRow, SuperTab, UserRow } from "@/components/super-admin/types";

const MOCK_USERS: UserRow[] = [
  { id: "u1", email: "maria@email.com", role: "Customer", business: "Flavor Hub Restaurant", orders: 24, total_spent: 38400, tier: "Silver" },
  { id: "u2", email: "jose@email.com", role: "Customer", business: "Golden Rice Trading", orders: 18, total_spent: 29700, tier: "Silver" },
  { id: "u3", email: "ana@email.com", role: "Customer", business: "FreshMart Grocery", orders: 31, total_spent: 52800, tier: "Gold" },
  { id: "u4", email: "mark@email.com", role: "Customer", business: "MediCare Pharmacy", orders: 9, total_spent: 14200, tier: "Regular" },
  { id: "u5", email: "lisa@email.com", role: "Customer", business: "StyleZone Salon", orders: 45, total_spent: 71600, tier: "Gold" },
];

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
    return businesses.filter((b) => b.name.toLowerCase().includes(q) || (b.email ?? "").toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
  }, [businesses, search]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter((u) => u.email.toLowerCase().includes(q) || u.business.toLowerCase().includes(q));
  }, [search]);

  const stats = useMemo(() => {
    const total = businesses.length;
    const active = businesses.filter((b) => b.activation_status === "active").length;
    const pending = businesses.filter((b) => b.activation_status === "pending").length;
    const suspended = businesses.filter((b) => b.activation_status === "suspended").length;
    const totalUsers = MOCK_USERS.length + businesses.length * 8;
    return { total, active, pending, suspended, totalUsers };
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
      const { error: updateError } = await supabase.from("businesses").update({ activation_status: status }).eq("id", id);
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
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <SuperAdminSidebar tab={tab} onTabChange={setTab} onLogout={logout} />

        <section className="min-w-0 flex-1">
          <SuperAdminHeader />

          <main className="p-4 md:p-8">
            {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
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
              <BusinessesPanel rows={filteredBusinesses} loading={loading} savingId={savingId} onActivate={setStatus} />
            )}
            {tab === "users" && <UsersPanel />}
            {tab === "systemmenu" && <SystemMenuPanel />}
            {tab === "menuuserauth" && <MenuUserAuthorizationPanel />}
            {tab === "billing" && <BillingPanel totalBusinesses={stats.total} activeBusinesses={stats.active} />}
            {tab === "settings" && <SettingsPanel />}
          </main>
        </section>
      </div>
    </div>
  );
}
