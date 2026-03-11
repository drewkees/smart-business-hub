import { Skeleton } from "@/components/ui/skeleton";
import { ActionBtn, StatusBadge, formatTypeLabel } from "./shared";
import type { ActivationStatus, BusinessRow } from "./types";

export function BusinessesPanel({
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`super-biz-skeleton-${i}`} className="border-b border-slate-100">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-32 rounded-lg" /></td>
                  </tr>
                ))
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
                    <td className="px-4 py-3 text-slate-700">{formatTypeLabel(b.type)}</td>
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
