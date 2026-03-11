import { Building2, CircleDollarSign, Globe2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionBtn, RowMetric, StatusBadge, TopStat, formatTypeLabel } from "./shared";
import type { ActivationStatus, BusinessRow, OverviewStats } from "./types";

export function OverviewPanel({
  stats,
  loading,
  businesses,
  onRefresh,
  onActivate,
  savingId,
}: {
  stats: OverviewStats;
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
                  <p className="text-xs text-slate-500">{formatTypeLabel(b.type)}</p>
                </div>
                <StatusBadge status={b.activation_status} />
                <div className="flex items-center gap-1">
                  <ActionBtn text="Activate" onClick={() => onActivate(b.id, "active")} disabled={savingId === b.id} tone="active" />
                  <ActionBtn text="Suspend" onClick={() => onActivate(b.id, "suspended")} disabled={savingId === b.id} tone="suspend" />
                </div>
              </div>
            ))}
            {loading && (
              <div className="space-y-2 px-4 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-8 w-28 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
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
