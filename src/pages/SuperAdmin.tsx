import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Bell,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

type ActivationStatus = "pending" | "active" | "suspended";
type SuperTab = "overview" | "businesses" | "users" | "billing" | "settings";

type BusinessRow = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  activation_status: ActivationStatus;
  created_at: string;
};

type UserRow = {
  id: string;
  email: string;
  role: string;
  business: string;
  orders: number;
  total_spent: number;
  tier: "Silver" | "Gold" | "Regular";
};

const TABS: Array<{ id: SuperTab; label: string; icon: any }> = [
  { id: "overview", label: "System Overview", icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", icon: Building2 },
  { id: "users", label: "All Users", icon: Users },
  { id: "billing", label: "Billing & Plans", icon: CircleDollarSign },
  { id: "settings", label: "System Settings", icon: Shield },
];

const MOCK_USERS: UserRow[] = [
  { id: "u1", email: "maria@email.com", role: "Customer", business: "Flavor Hub Restaurant", orders: 24, total_spent: 38400, tier: "Silver" },
  { id: "u2", email: "jose@email.com", role: "Customer", business: "Golden Rice Trading", orders: 18, total_spent: 29700, tier: "Silver" },
  { id: "u3", email: "ana@email.com", role: "Customer", business: "FreshMart Grocery", orders: 31, total_spent: 52800, tier: "Gold" },
  { id: "u4", email: "mark@email.com", role: "Customer", business: "MediCare Pharmacy", orders: 9, total_spent: 14200, tier: "Regular" },
  { id: "u5", email: "lisa@email.com", role: "Customer", business: "StyleZone Salon", orders: 45, total_spent: 71600, tier: "Gold" },
];

function formatMoney(n: number) {
  return `P ${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: ActivationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        status === "active"
          ? "bg-emerald-100 text-emerald-700"
          : status === "pending"
            ? "bg-amber-100 text-amber-700"
            : "bg-rose-100 text-rose-700"
      )}
    >
      {status}
    </span>
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
        <aside className="hidden w-64 shrink-0 bg-[#061126] text-slate-200 lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-400 text-[#061126]">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-white">BizPOS Pro</p>
                <p className="text-xs text-slate-400">Platform Control</p>
              </div>
            </div>
            <span className="mt-4 inline-flex rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300">System Owner</span>
          </div>

          <nav className="flex-1 px-3 py-4">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
            <div className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    tab === id ? "bg-blue-600 text-white shadow-[0_8px_24px_-16px_rgba(37,99,235,1)]" : "text-slate-300 hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-800 p-3">
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
            <button className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex-1" />
            <div className="hidden w-72 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-500 md:flex">
              <Search className="h-4 w-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <Bell className="h-4 w-4 text-slate-500" />
            <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-sm font-semibold text-white">C</div>
          </header>

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
              <BusinessesPanel
                rows={filteredBusinesses}
                loading={loading}
                savingId={savingId}
                onActivate={setStatus}
              />
            )}
            {tab === "users" && <UsersPanel users={filteredUsers} />}
            {tab === "billing" && <BillingPanel totalBusinesses={stats.total} activeBusinesses={stats.active} />}
            {tab === "settings" && <SettingsPanel />}
          </main>
        </section>
      </div>
    </div>
  );
}

function OverviewPanel({
  stats,
  loading,
  businesses,
  onRefresh,
  onActivate,
  savingId,
}: {
  stats: { total: number; active: number; pending: number; suspended: number; totalUsers: number };
  loading: boolean;
  businesses: BusinessRow[];
  onRefresh: () => void;
  onActivate: (id: string, status: ActivationStatus) => Promise<void>;
  savingId: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">System Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Platform-wide health, metrics, and business registry</p>
        </div>
        <button onClick={onRefresh} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TopStat label="Total Businesses" value={String(stats.total)} sub={`+${Math.max(1, stats.pending)} this month`} icon={Building2} />
        <TopStat label="Active Branches" value={String(stats.total + 4)} sub="+1 this week" icon={Globe2} />
        <TopStat label="Platform Revenue" value="P2.4M" sub="+18.2% vs last mo." icon={CircleDollarSign} />
        <TopStat label="Total Users" value={String(stats.totalUsers)} sub={`+${Math.max(1, stats.active)} this month`} icon={Users} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">Registered Businesses</p>
              <p className="text-xs text-slate-500">All tenants on this platform</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {(loading ? [] : businesses.slice(0, 6)).map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.type}</p>
                </div>
                <StatusBadge status={b.activation_status} />
                <div className="flex items-center gap-1">
                  <ActionBtn text="Activate" onClick={() => onActivate(b.id, "active")} disabled={savingId === b.id} tone="active" />
                  <ActionBtn text="Suspend" onClick={() => onActivate(b.id, "suspended")} disabled={savingId === b.id} tone="suspend" />
                </div>
              </div>
            ))}
            {loading && <p className="px-4 py-8 text-center text-sm text-slate-500">Loading businesses...</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">System Health</p>
            <div className="mt-3 space-y-2 text-sm">
              <RowMetric label="API Uptime" value="99.98%" ok />
              <RowMetric label="Database" value="Healthy" ok />
              <RowMetric label="Storage" value="42% used" warn />
              <RowMetric label="Auth Service" value="Online" ok />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">Recent Activity</p>
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-slate-600">Flavor Hub Restaurant - status set to active</p>
              <p className="text-slate-600">MediCare Pharmacy - moved to pending</p>
              <p className="text-slate-600">Golden Rice Trading - business created</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessesPanel({
  rows,
  loading,
  savingId,
  onActivate,
}: {
  rows: BusinessRow[];
  loading: boolean;
  savingId: string | null;
  onActivate: (id: string, status: ActivationStatus) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Business Management</h1>
          <p className="mt-1 text-sm text-slate-500">Register, manage, and monitor all platform tenants</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Activation Key</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Loading businesses...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No businesses found.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.email ?? "-"} | {b.phone ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.activation_status} />
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{`ACT-${b.id.split("-")[0].toUpperCase()}`}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ActionBtn text="Activate" onClick={() => onActivate(b.id, "active")} disabled={savingId === b.id} tone="active" />
                        <ActionBtn text="Pending" onClick={() => onActivate(b.id, "pending")} disabled={savingId === b.id} tone="pending" />
                        <ActionBtn text="Suspend" onClick={() => onActivate(b.id, "suspended")} disabled={savingId === b.id} tone="suspend" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersPanel({ users }: { users: UserRow[] }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">All Users</h1>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Tier</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{u.email}</p>
                  <p className="text-xs text-slate-500">{u.role}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{u.business}</td>
                <td className="px-4 py-3 text-slate-700">{u.orders}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{formatMoney(u.total_spent)}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", u.tier === "Gold" ? "bg-amber-100 text-amber-700" : u.tier === "Silver" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600")}>
                    {u.tier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingPanel({ totalBusinesses, activeBusinesses }: { totalBusinesses: number; activeBusinesses: number }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Billing & Plans</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Tile title="Total MRR" value="P 48,000" sub="Platform recurring revenue" icon={CircleDollarSign} />
        <Tile title="Paying Businesses" value={`${activeBusinesses}/${totalBusinesses}`} sub="Currently active subscriptions" icon={CreditCard} />
        <Tile title="Trials" value={String(Math.max(0, totalBusinesses - activeBusinesses))} sub="Pending conversions" icon={CheckCircle2} />
      </div>
    </div>
  );
}

function SettingsPanel() {
  const items = [
    { title: "Business Profile", desc: "Name, address, logo, business type" },
    { title: "User & Role Management", desc: "Manage staff accounts and permissions" },
    { title: "Notifications", desc: "Low stock alerts, updates, reports" },
    { title: "Security", desc: "Password policy, 2FA, session settings" },
    { title: "Appearance", desc: "Theme, color scheme, layout preferences" },
    { title: "POS Configuration", desc: "Receipt format, tax settings, payment methods" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">System Settings</h1>
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="font-semibold text-slate-900">{s.title}</p>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowMetric({ label, value, ok, warn }: { label: string; value: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={cn("font-medium", ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-slate-700")}>{value}</span>
    </div>
  );
}

function TopStat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-emerald-600">{sub}</p>
    </div>
  );
}

function Tile({ title, value, sub, icon: Icon }: { title: string; value: string; sub: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function ActionBtn({
  text,
  onClick,
  disabled,
  tone,
}: {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "active" | "pending" | "suspend";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60",
        tone === "active"
          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          : tone === "pending"
            ? "border-amber-300 text-amber-700 hover:bg-amber-50"
            : "border-rose-300 text-rose-700 hover:bg-rose-50"
      )}
    >
      {text}
    </button>
  );
}
