import { useEffect, useState } from "react";
import { Users, Search, RefreshCw, ShieldCheck, Building2, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RealUserRow } from "./types";

const ROLE_META: Record<string, { label: string; class: string }> = {
  superadmin: { label: "System Owner", class: "bg-amber-500/15 text-amber-300 border border-amber-500/30" },
  owner:      { label: "Owner",        class: "bg-amber-500/15 text-amber-300 border border-amber-500/30" },
  admin:      { label: "Admin",        class: "bg-blue-500/15 text-blue-300 border border-blue-500/30" },
  cashier:    { label: "Cashier",      class: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" },
};

const STATUS_META = {
  active:    { icon: CheckCircle2, class: "text-emerald-400", label: "Active" },
  pending:   { icon: Clock,        class: "text-amber-400",   label: "Pending" },
  suspended: { icon: XCircle,      class: "text-rose-400",    label: "Suspended" },
};

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { label: role, class: "bg-slate-700 text-slate-300 border border-slate-600" };
}

function getStatusMeta(status: string) {
  return STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.pending;
}

function Avatar({ name, email }: { name: string | null; email: string | null }) {
  const initials = (name || email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const hue = ((name || email || "X").charCodeAt(0) * 37) % 360;
  return (
    <div
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
      style={{ background: `hsl(${hue},55%,38%)` }}
    >
      {initials}
    </div>
  );
}

export function UsersPanel() {
  const [users, setUsers] = useState<RealUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    if (!supabase) {
      setError("Supabase not configured.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Load memberships with businesses
      const { data: memberships, error: memErr } = await supabase
        .from("user_memberships")
        .select("user_id, role, business_id, businesses(id, name, activation_status)")
        .order("created_at", { ascending: false });

      if (memErr) throw memErr;

      // Load users from `users` table (profile table)
      const userIds = Array.from(new Set((memberships ?? []).map((m: any) => m.user_id).filter(Boolean)));
      const { data: profiles, error: profileErr } = userIds.length
        ? await supabase.from("users").select("id, email, full_name").in("id", userIds)
        : { data: [], error: null };

      if (profileErr) throw profileErr;

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      const rows: RealUserRow[] = (memberships ?? []).map((m: any) => {
        const profile = profileMap.get(m.user_id);
        const biz = Array.isArray(m.businesses) ? m.businesses[0] : m.businesses;
        return {
          id: m.user_id,
          email: profile?.email ?? null,
          full_name: profile?.full_name ?? null,
          role: m.role ?? "admin",
          business_name: biz?.name ?? "—",
          business_id: m.business_id,
          created_at: null,
          status: (biz?.activation_status ?? "pending") as "active" | "pending" | "suspended",
        };
      });

      setUsers(rows);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const roles = ["all", ...Array.from(new Set(users.map((u) => u.role)))];

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQ = !q || (u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q) || u.business_name.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchQ && matchRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    cashiers: users.filter((u) => u.role === "cashier").length,
    owners: users.filter((u) => u.role === "superadmin" || u.role === "owner").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">All Users</h1>
        <p className="text-sm text-slate-400">Platform-wide user directory from membership records.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Users",    value: stats.total,    icon: Users,       color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "System Owners",  value: stats.owners,   icon: ShieldCheck, color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Admins",         value: stats.admins,   icon: Building2,   color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          { label: "Cashiers",       value: stats.cashiers, icon: CheckCircle2,color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn("rounded-2xl border p-4", bg)}>
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", color)} />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
            </div>
            <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[26px] border border-slate-700/80 bg-[#1a2436] shadow-[0_30px_80px_-48px_rgba(15,23,42,0.9)]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-700/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, email, business…"
              className="h-10 w-full rounded-xl border border-slate-600 bg-slate-800/60 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-700 bg-slate-800/60 p-1 gap-1">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                    roleFilter === r ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-400 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-800/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full bg-slate-700" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 bg-slate-700" />
                          <Skeleton className="h-3 w-24 bg-slate-700/70" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Skeleton className="h-6 w-20 rounded-full bg-slate-700" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-3.5 w-36 bg-slate-700" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-16 bg-slate-700" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                    <p className="text-sm text-slate-500">No users found{search ? ` for "${search}"` : ""}.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => {
                  const roleMeta = getRoleMeta(u.role);
                  const statusMeta = getStatusMeta(u.status);
                  const StatusIcon = statusMeta.icon;
                  return (
                    <tr
                      key={`${u.id}-${idx}`}
                      className="group border-t border-slate-800/60 transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name} email={u.email} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {u.full_name || u.email?.split("@")[0] || "Unknown"}
                            </p>
                            <p className="truncate text-xs text-slate-400">{u.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", roleMeta.class)}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span className="truncate max-w-[180px]">{u.business_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className={cn("flex items-center gap-1.5 text-xs font-medium", statusMeta.class)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusMeta.label}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
}
