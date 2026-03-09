import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const monthly = [
  { month: "Jan", revenue: 142000, orders: 480 },
  { month: "Feb", revenue: 165000, orders: 540 },
  { month: "Mar", revenue: 138000, orders: 460 },
  { month: "Apr", revenue: 187000, orders: 620 },
  { month: "May", revenue: 204000, orders: 680 },
  { month: "Jun", revenue: 229000, orders: 740 },
];

export default function Reports() {
  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Monthly Revenue", value: "₱ 229,000", change: "+12.3%" },
            { label: "Avg Order Value", value: "₱ 309", change: "+4.1%" },
            { label: "Total Orders", value: "740", change: "+8.8%" },
            { label: "New Customers", value: "86", change: "+15.2%" },
          ].map(({ label, value, change }) => (
            <div key={label} className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold font-display text-foreground mt-1">{value}</p>
              <p className="text-xs text-success font-semibold mt-1">{change} vs last month</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-1">Monthly Revenue</h3>
            <p className="text-xs text-muted-foreground mb-4">6-month trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [`₱${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-1">Order Volume</h3>
            <p className="text-xs text-muted-foreground mb-4">Monthly orders count</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
