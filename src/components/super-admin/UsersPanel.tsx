import { formatMoney } from "./shared";
import type { UserRow } from "./types";

export function UsersPanel({ users }: { users: UserRow[] }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">All Users</h1>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
                  <span className={u.tier === "Gold" ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700" : u.tier === "Silver" ? "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"}>
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
