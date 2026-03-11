import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

type MonthlyPoint = {
  key: string;
  month: string;
  revenue: number;
  orders: number;
  customers: number;
};

type MetricCard = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

const DEMO_MONTHLY: MonthlyPoint[] = [
  { key: "2025-10", month: "Oct", revenue: 142000, orders: 480, customers: 86 },
  { key: "2025-11", month: "Nov", revenue: 165000, orders: 540, customers: 94 },
  { key: "2025-12", month: "Dec", revenue: 138000, orders: 460, customers: 79 },
  { key: "2026-01", month: "Jan", revenue: 187000, orders: 620, customers: 103 },
  { key: "2026-02", month: "Feb", revenue: 204000, orders: 680, customers: 112 },
  { key: "2026-03", month: "Mar", revenue: 229000, orders: 740, customers: 126 },
];

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function formatMoney(n: number) {
  return `P ${Math.round(Number(n || 0)).toLocaleString()}`;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function fmtChange(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function Reports() {
  const { currentBusiness } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>(DEMO_MONTHLY);

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !supabase || !isUuid(currentBusiness.id)) {
          if (active) setMonthly(DEMO_MONTHLY);
          return;
        }

        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const start = new Date(currentMonthStart);
        start.setMonth(start.getMonth() - 5);

        const { data, error: ordersError } = await supabase
          .from("orders")
          .select("total_amount,created_at,customer_name")
          .eq("business_id", currentBusiness.id)
          .gte("created_at", start.toISOString())
          .order("created_at", { ascending: true });

        if (ordersError) throw ordersError;

        const monthMap = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();

        for (let i = 0; i < 6; i += 1) {
          const d = new Date(start);
          d.setMonth(start.getMonth() + i);
          monthMap.set(monthKey(d), { revenue: 0, orders: 0, customers: new Set<string>() });
        }

        (data ?? []).forEach((row: any) => {
          const dt = new Date(row.created_at);
          const key = monthKey(dt);
          const bucket = monthMap.get(key);
          if (!bucket) return;
          bucket.revenue += Number(row.total_amount ?? 0);
          bucket.orders += 1;
          const customerName = String(row.customer_name ?? "").trim();
          if (customerName) bucket.customers.add(customerName.toLowerCase());
        });

        const next: MonthlyPoint[] = Array.from(monthMap.entries()).map(([key, val]) => {
          const [y, m] = key.split("-");
          const d = new Date(Number(y), Number(m) - 1, 1);
          return {
            key,
            month: d.toLocaleDateString("en-US", { month: "short" }),
            revenue: val.revenue,
            orders: val.orders,
            customers: val.customers.size,
          };
        });

        if (!active) return;
        setMonthly(next);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "Failed to load reports data.");
        setMonthly(DEMO_MONTHLY);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReports();

    return () => {
      active = false;
    };
  }, [currentBusiness.id]);

  const cards = useMemo<MetricCard[]>(() => {
    const current = monthly[monthly.length - 1] ?? { revenue: 0, orders: 0, customers: 0 };
    const prev = monthly[monthly.length - 2] ?? { revenue: 0, orders: 0, customers: 0 };

    const avgCurrent = current.orders > 0 ? current.revenue / current.orders : 0;
    const avgPrev = prev.orders > 0 ? prev.revenue / prev.orders : 0;

    const revDelta = pctChange(current.revenue, prev.revenue);
    const avgDelta = pctChange(avgCurrent, avgPrev);
    const ordDelta = pctChange(current.orders, prev.orders);
    const custDelta = pctChange(current.customers, prev.customers);

    return [
      {
        label: "Monthly Revenue",
        value: formatMoney(current.revenue),
        change: fmtChange(revDelta),
        positive: revDelta >= 0,
      },
      {
        label: "Avg Order Value",
        value: formatMoney(avgCurrent),
        change: fmtChange(avgDelta),
        positive: avgDelta >= 0,
      },
      {
        label: "Total Orders",
        value: String(current.orders),
        change: fmtChange(ordDelta),
        positive: ordDelta >= 0,
      },
      {
        label: "Active Customers",
        value: String(current.customers),
        change: fmtChange(custDelta),
        positive: custDelta >= 0,
      },
    ];
  }, [monthly]);

  return (
    <AppLayout title="Reports & Analytics">
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-danger/30 bg-danger-muted/60 px-4 py-2 text-sm text-danger">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Skeleton className="h-[290px] w-full rounded-2xl" />
              <Skeleton className="h-[290px] w-full rounded-2xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map(({ label, value, change, positive }) => (
                <div key={label} className="bg-card rounded-2xl p-4 shadow-card border border-border">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold font-display text-foreground mt-1">{value}</p>
                  <p className={`text-xs font-semibold mt-1 ${positive ? "text-success" : "text-danger"}`}>{change} vs last month</p>
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
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `P${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [formatMoney(v), "Revenue"]} />
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
          </>
        )}
      </div>
    </AppLayout>
  );
}
