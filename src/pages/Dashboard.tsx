import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  PhilippinePeso,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  MoreHorizontal,
  Star,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { listInventoryItems, type InventoryItemRow } from "@/lib/inventory";
import { Skeleton } from "@/components/ui/skeleton";

type SalesPoint = { day: string; sales: number; orders: number };
type CategoryPoint = { name: string; value: number };
type RecentOrder = { id: string; customer: string; items: number; amount: number; status: string; time: string };
type LowStockRow = { name: string; stock: number; reorder: number; category: string };
type TopProduct = { name: string; sold: number; revenue: number };
type StaffRow = { name: string; role: string; txns: number; sales: number; status: "active" | "break" | "offline" };
type KPI = { label: string; value: string; change: string; positive: boolean; icon: any; gradient: string; sub?: string };

const PIE_COLORS = ["#2563eb", "#0f766e", "#475569", "#0369a1", "#1d4ed8", "#334155"];
const ENTERPRISE_HEADER_GRADIENT = "from-slate-900 via-slate-800 to-slate-700";
const KPI_GRADIENTS = [
  "from-slate-700 to-slate-600",
  "from-blue-800 to-blue-700",
  "from-cyan-800 to-cyan-700",
  "from-indigo-800 to-indigo-700",
];
const DAILY_TARGET = 50000;

const DEMO_SALES: SalesPoint[] = [
  { day: "Mon", sales: 12400, orders: 44 },
  { day: "Tue", sales: 18200, orders: 62 },
  { day: "Wed", sales: 15800, orders: 53 },
  { day: "Thu", sales: 22100, orders: 71 },
  { day: "Fri", sales: 28500, orders: 89 },
  { day: "Sat", sales: 34200, orders: 105 },
  { day: "Sun", sales: 19600, orders: 67 },
];

const DEMO_CATEGORIES: CategoryPoint[] = [
  { name: "Food", value: 38 },
  { name: "Beverages", value: 24 },
  { name: "Snacks", value: 18 },
  { name: "Others", value: 20 },
];

const DEMO_RECENT: RecentOrder[] = [
  { id: "#1042", customer: "Maria Santos", items: 3, amount: 1250, status: "completed", time: "2m ago" },
  { id: "#1041", customer: "Jose Reyes", items: 7, amount: 3420, status: "processing", time: "8m ago" },
  { id: "#1040", customer: "Ana Cruz", items: 2, amount: 680, status: "completed", time: "15m ago" },
];

const DEMO_LOW_STOCK: LowStockRow[] = [
  { name: "Paracetamol 500mg", stock: 5, reorder: 50, category: "Medicine" },
  { name: "Premium Jasmine Rice", stock: 2, reorder: 20, category: "Rice" },
  { name: "Mineral Water 500ml", stock: 8, reorder: 30, category: "Beverage" },
];

const DEMO_TOP: TopProduct[] = [
  { name: "Chicken Adobo Rice Bowl", sold: 142, revenue: 25560 },
  { name: "Premium Jasmine Rice (5kg)", sold: 98, revenue: 29400 },
  { name: "Bottled Water 500ml", sold: 215, revenue: 6450 },
];

const DEMO_STAFF: StaffRow[] = [
  { name: "Maria C.", role: "Cashier", txns: 34, sales: 42800, status: "active" },
  { name: "Jose B.", role: "Cashier", txns: 28, sales: 36200, status: "active" },
  { name: "Ana R.", role: "Supervisor", txns: 12, sales: 18500, status: "break" },
];

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function formatMoney(n: number) {
  return `P ${Math.round(Number(n || 0)).toLocaleString()}`;
}

function toIsoStartOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function fmtChange(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function ago(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const sec = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function KPICard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  gradient,
  sub,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: any;
  gradient: string;
  sub?: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl p-5 shadow-card border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border",
            positive ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200",
          )}
        >
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground font-display">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    processing: "bg-amber-50 text-amber-700 border border-amber-200",
    refunded: "bg-rose-50 text-rose-700 border border-rose-200",
    pending: "bg-slate-100 text-slate-600 border border-slate-200",
    cancelled: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", map[status] || "bg-secondary text-secondary-foreground")}>{status}</span>;
}

export default function Dashboard() {
  const { currentBusiness } = useApp();
  const cfg = BUSINESS_TYPE_CONFIG[currentBusiness.type];
  const BizIcon = cfg.icon;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayRevenueValue, setTodayRevenueValue] = useState(37840);

  const [kpis, setKpis] = useState<KPI[]>([
    { label: "Today's Revenue", value: formatMoney(37840), change: "+12.4%", positive: true, gradient: KPI_GRADIENTS[0], icon: PhilippinePeso, sub: "vs P 33,670 yesterday" },
    { label: "Total Orders", value: "121", change: "+8.2%", positive: true, gradient: KPI_GRADIENTS[1], icon: ShoppingCart, sub: "Avg P 312 / order" },
    { label: "Items Sold", value: "487", change: "+5.1%", positive: true, gradient: KPI_GRADIENTS[2], icon: Package, sub: "Across 38 SKUs" },
    { label: "Active Customers", value: "94", change: "-2.3%", positive: false, gradient: KPI_GRADIENTS[3], icon: Users, sub: "12 new today" },
  ]);

  const [salesData, setSalesData] = useState<SalesPoint[]>(DEMO_SALES);
  const [categoryData, setCategoryData] = useState<CategoryPoint[]>(DEMO_CATEGORIES);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(DEMO_RECENT);
  const [lowStockItems, setLowStockItems] = useState<LowStockRow[]>(DEMO_LOW_STOCK);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(DEMO_TOP);
  const [staffActivity, setStaffActivity] = useState<StaffRow[]>(DEMO_STAFF);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !supabase || !isUuid(currentBusiness.id)) {
          return;
        }

        const now = new Date();
        const startToday = new Date(now);
        startToday.setHours(0, 0, 0, 0);

        const startYesterday = new Date(startToday);
        startYesterday.setDate(startYesterday.getDate() - 1);

        const start7 = new Date(startToday);
        start7.setDate(start7.getDate() - 6);

        const start30 = new Date(startToday);
        start30.setDate(start30.getDate() - 29);

        const [ordersRes, orderItemsRes, staffRes, invRows] = await Promise.all([
          supabase
            .from("orders")
            .select("id,order_number,customer_name,status,total_amount,created_at,created_by,order_items(count)")
            .eq("business_id", currentBusiness.id)
            .gte("created_at", toIsoStartOfDay(start30))
            .order("created_at", { ascending: false })
            .limit(3000),
          supabase
            .from("order_items")
            .select("item_id,item_name,quantity,line_total,created_at")
            .eq("business_id", currentBusiness.id)
            .gte("created_at", toIsoStartOfDay(start30))
            .limit(5000),
          supabase
            .from("staff_members")
            .select("first_name,last_name,status,auth_user_id,staff_roles(name)")
            .eq("business_id", currentBusiness.id)
            .limit(20),
          listInventoryItems(currentBusiness.id),
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (orderItemsRes.error) throw orderItemsRes.error;
        if (staffRes.error) throw staffRes.error;

        const orders = (ordersRes.data ?? []) as any[];
        const orderItems = (orderItemsRes.data ?? []) as any[];
        const inventory = invRows as InventoryItemRow[];

        const todayOrders = orders.filter((o) => new Date(o.created_at).getTime() >= startToday.getTime());
        const yesterdayOrders = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startYesterday.getTime() && t < startToday.getTime();
        });

        const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
        const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);

        const todayItems = orderItems
          .filter((r) => new Date(r.created_at).getTime() >= startToday.getTime())
          .reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);
        const yesterdayItems = orderItems
          .filter((r) => {
            const t = new Date(r.created_at).getTime();
            return t >= startYesterday.getTime() && t < startToday.getTime();
          })
          .reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);

        const todayCustomers = new Set(
          todayOrders
            .map((o) => String(o.customer_name ?? "").trim())
            .filter((v) => v.length > 0),
        ).size;
        const yesterdayCustomers = new Set(
          yesterdayOrders
            .map((o) => String(o.customer_name ?? "").trim())
            .filter((v) => v.length > 0),
        ).size;

        const avgOrder = todayOrders.length ? todayRevenue / todayOrders.length : 0;

        const revDelta = pctChange(todayRevenue, yesterdayRevenue);
        const ordDelta = pctChange(todayOrders.length, yesterdayOrders.length);
        const itemDelta = pctChange(todayItems, yesterdayItems);
        const custDelta = pctChange(todayCustomers, yesterdayCustomers);

        const nextKpis: KPI[] = [
          {
            label: "Today's Revenue",
            value: formatMoney(todayRevenue),
            change: fmtChange(revDelta),
            positive: revDelta >= 0,
            gradient: KPI_GRADIENTS[0],
            icon: PhilippinePeso,
            sub: `vs ${formatMoney(yesterdayRevenue)} yesterday`,
          },
          {
            label: "Total Orders",
            value: String(todayOrders.length),
            change: fmtChange(ordDelta),
            positive: ordDelta >= 0,
            gradient: KPI_GRADIENTS[1],
            icon: ShoppingCart,
            sub: `Avg ${formatMoney(avgOrder)} / order`,
          },
          {
            label: "Items Sold",
            value: String(todayItems),
            change: fmtChange(itemDelta),
            positive: itemDelta >= 0,
            gradient: KPI_GRADIENTS[2],
            icon: Package,
            sub: `Across ${inventory.length} SKUs`,
          },
          {
            label: "Active Customers",
            value: String(todayCustomers),
            change: fmtChange(custDelta),
            positive: custDelta >= 0,
            gradient: KPI_GRADIENTS[3],
            icon: Users,
            sub: `${todayCustomers} unique today`,
          },
        ];

        const dayKeys: Array<{ key: string; day: string }> = [];
        for (let i = 0; i < 7; i += 1) {
          const d = new Date(start7);
          d.setDate(start7.getDate() + i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const day = d.toLocaleDateString("en-US", { weekday: "short" });
          dayKeys.push({ key, day });
        }

        const salesMap = new Map<string, { sales: number; orders: number }>();
        dayKeys.forEach((d) => salesMap.set(d.key, { sales: 0, orders: 0 }));

        orders.forEach((o) => {
          const d = new Date(o.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const row = salesMap.get(key);
          if (!row) return;
          row.sales += Number(o.total_amount ?? 0);
          row.orders += 1;
        });

        const nextSales: SalesPoint[] = dayKeys.map((d) => ({
          day: d.day,
          sales: Number(salesMap.get(d.key)?.sales ?? 0),
          orders: Number(salesMap.get(d.key)?.orders ?? 0),
        }));

        const categoryByItemId = new Map<string, string>();
        inventory.forEach((it) => categoryByItemId.set(it.id, it.category || "Others"));

        const todayCategoryTotals = new Map<string, number>();
        orderItems
          .filter((r) => new Date(r.created_at).getTime() >= startToday.getTime())
          .forEach((r) => {
            const category = categoryByItemId.get(String(r.item_id ?? "")) ?? "Others";
            const qty = Number(r.quantity ?? 0);
            todayCategoryTotals.set(category, (todayCategoryTotals.get(category) ?? 0) + qty);
          });

        if (todayCategoryTotals.size === 0) {
          orderItems.forEach((r) => {
            const category = categoryByItemId.get(String(r.item_id ?? "")) ?? "Others";
            const qty = Number(r.quantity ?? 0);
            todayCategoryTotals.set(category, (todayCategoryTotals.get(category) ?? 0) + qty);
          });
        }

        const totalCategoryQty = Array.from(todayCategoryTotals.values()).reduce((sum, v) => sum + v, 0);
        const nextCategories: CategoryPoint[] = Array.from(todayCategoryTotals.entries())
          .map(([name, qty]) => ({ name, value: totalCategoryQty > 0 ? Math.round((qty / totalCategoryQty) * 100) : 0 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        const nextRecent: RecentOrder[] = orders.slice(0, 5).map((o) => ({
          id: o.order_number || o.id,
          customer: String(o.customer_name ?? "Walk-in"),
          items: Number(o.order_items?.[0]?.count ?? 0),
          amount: Number(o.total_amount ?? 0),
          status: String(o.status ?? "completed"),
          time: ago(String(o.created_at)),
        }));

        const nextLowStock: LowStockRow[] = inventory
          .filter((it) => Number(it.current_stock ?? 0) <= Number(it.reorder_level ?? 0))
          .sort((a, b) => Number(a.current_stock ?? 0) - Number(b.current_stock ?? 0))
          .slice(0, 6)
          .map((it) => ({
            name: it.name,
            stock: Number(it.current_stock ?? 0),
            reorder: Number(it.reorder_level ?? 0),
            category: it.category || "General",
          }));

        const topMap = new Map<string, TopProduct>();
        orderItems.forEach((r) => {
          const name = String(r.item_name ?? "Unknown Item");
          const sold = Number(r.quantity ?? 0);
          const revenue = Number(r.line_total ?? 0);
          const prev = topMap.get(name) ?? { name, sold: 0, revenue: 0 };
          prev.sold += sold;
          prev.revenue += revenue;
          topMap.set(name, prev);
        });
        const nextTop = Array.from(topMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

        const staffRows = (staffRes.data ?? []) as any[];
        const byCreator = new Map<string, { txns: number; sales: number }>();
        orders.forEach((o) => {
          const key = String(o.created_by ?? "");
          if (!key) return;
          const prev = byCreator.get(key) ?? { txns: 0, sales: 0 };
          prev.txns += 1;
          prev.sales += Number(o.total_amount ?? 0);
          byCreator.set(key, prev);
        });

        const nextStaff: StaffRow[] = staffRows.slice(0, 8).map((s) => {
          const authId = String(s.auth_user_id ?? "");
          const perf = byCreator.get(authId) ?? { txns: 0, sales: 0 };
          const first = String(s.first_name ?? "").trim();
          const last = String(s.last_name ?? "").trim();
          const roleName = String(s.staff_roles?.name ?? "Staff");
          const rawStatus = String(s.status ?? "inactive");
          const status: StaffRow["status"] = rawStatus === "active" ? "active" : rawStatus === "suspended" ? "break" : "offline";
          return {
            name: `${first} ${last}`.trim() || "Staff",
            role: roleName,
            txns: perf.txns,
            sales: perf.sales,
            status,
          };
        });

        if (!active) return;
        setTodayRevenueValue(todayRevenue);
        setKpis(nextKpis);
        setSalesData(nextSales.length ? nextSales : DEMO_SALES);
        setCategoryData(nextCategories.length ? nextCategories : DEMO_CATEGORIES);
        setRecentOrders(nextRecent.length ? nextRecent : DEMO_RECENT);
        setLowStockItems(nextLowStock.length ? nextLowStock : []);
        setTopProducts(nextTop.length ? nextTop : DEMO_TOP);
        setStaffActivity(nextStaff.length ? nextStaff : DEMO_STAFF);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "Failed to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [currentBusiness.id]);

  const topRevenueMax = useMemo(() => Math.max(...topProducts.map((p) => p.revenue), 1), [topProducts]);
  const achievedPct = useMemo(() => {
    if (DAILY_TARGET <= 0) return 0;
    return Math.max(0, Math.min(100, (todayRevenueValue / DAILY_TARGET) * 100));
  }, [todayRevenueValue]);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className={`rounded-2xl bg-gradient-to-r ${ENTERPRISE_HEADER_GRADIENT} p-5 flex items-center justify-between overflow-hidden relative`}>
          <div className="absolute right-0 top-0 w-64 h-full opacity-10">
            <div className="w-64 h-64 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <BizIcon className="w-5 h-5 text-white/80" />
              <span className="text-slate-300 text-sm font-medium">{cfg.label}</span>
            </div>
            <h2 className="text-white text-xl font-bold font-display">{currentBusiness.name}</h2>
            <p className="text-slate-300 text-sm mt-0.5">Today, {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="relative z-10 text-right hidden sm:block">
            <p className="text-slate-300 text-sm">Daily Target</p>
            <p className="text-white text-2xl font-bold font-display">{formatMoney(DAILY_TARGET)}</p>
            <div className="mt-2 bg-white/20 rounded-full h-2 w-36">
              <div className="bg-white rounded-full h-2" style={{ width: `${achievedPct}%` }} />
            </div>
            <p className="text-slate-300 text-xs mt-1">{achievedPct < 10 ? achievedPct.toFixed(1) : achievedPct.toFixed(0)}% achieved</p>
          </div>
        </div>

        {error && <div className="rounded-xl border border-danger/30 bg-danger-muted/60 px-4 py-2 text-sm text-danger">{error}</div>}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Skeleton className="h-72 w-full rounded-2xl xl:col-span-2" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground">Weekly Sales</h3>
                <p className="text-xs text-muted-foreground">Revenue and order volume</p>
              </div>
              <div className="flex gap-2">
                {["D", "W", "M"].map((t) => (
                  <button key={t} className={cn("text-xs px-2.5 py-1 rounded-lg font-medium transition-colors", t === "W" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>{t}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `P${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 89%)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`P${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground">Category Split</h3>
                <p className="text-xs text-muted-foreground">Today&apos;s breakdown</p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {categoryData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground truncate">{c.name}</span>
                  <span className="text-xs font-semibold text-foreground ml-auto">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Transactions</h3>
              <button className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-5 text-[10px] text-muted-foreground uppercase tracking-wide font-semibold px-3 pb-2">
                <span>Order</span>
                <span>Customer</span>
                <span className="text-center">Items</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Status</span>
              </div>
              {recentOrders.map((o) => (
                <motion.div key={o.id} whileHover={{ backgroundColor: "hsl(220 14% 94%)" }} className="grid grid-cols-5 items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors">
                  <span className="text-sm font-semibold text-primary">{o.id}</span>
                  <span className="text-sm text-foreground">{o.customer}</span>
                  <span className="text-sm text-center text-muted-foreground">{o.items}</span>
                  <span className="text-sm text-right font-semibold text-foreground">{formatMoney(o.amount)}</span>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <p className="text-[10px] text-muted-foreground mt-1">{o.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-warning-muted flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Low Stock Alerts</h3>
                <span className="ml-auto text-xs bg-warning-muted text-warning font-semibold px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
              </div>
              <div className="space-y-2.5">
                {lowStockItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No low-stock items right now.</p>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-danger">{item.stock} left</p>
                        <p className="text-[10px] text-muted-foreground">/{item.reorder} min</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary-muted flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Staff Activity</h3>
              </div>
              <div className="space-y-3">
                {staffActivity.map((s) => (
                  <div key={`${s.name}-${s.role}`} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white text-xs font-bold">
                        {s.name[0]}
                      </div>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                          s.status === "active" ? "bg-success" : s.status === "break" ? "bg-warning" : "bg-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.role} - {s.txns} txns</p>
                    </div>
                    <p className="text-xs font-semibold text-foreground">P{(s.sales / 1000).toFixed(1)}k</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground">Top Selling Products</h3>
              <p className="text-xs text-muted-foreground">Revenue contribution (last 30 days)</p>
            </div>
            <div className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold border border-slate-200">
              <Star className="w-3 h-3" /> Best performers
            </div>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs font-semibold text-foreground">{formatMoney(p.revenue)}</p>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${(p.revenue / topRevenueMax) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
