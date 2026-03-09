import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users,
  AlertTriangle, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Star, Activity, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const salesData = [
  { day: "Mon", sales: 12400, orders: 44 },
  { day: "Tue", sales: 18200, orders: 62 },
  { day: "Wed", sales: 15800, orders: 53 },
  { day: "Thu", sales: 22100, orders: 71 },
  { day: "Fri", sales: 28500, orders: 89 },
  { day: "Sat", sales: 34200, orders: 105 },
  { day: "Sun", sales: 19600, orders: 67 },
];

const categoryData = [
  { name: "Food", value: 38 },
  { name: "Beverages", value: 24 },
  { name: "Snacks", value: 18 },
  { name: "Others", value: 20 },
];

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

const recentOrders = [
  { id: "#1042", customer: "Maria Santos", items: 3, amount: 1250, status: "completed", time: "2m ago" },
  { id: "#1041", customer: "Jose Reyes", items: 7, amount: 3420, status: "processing", time: "8m ago" },
  { id: "#1040", customer: "Ana Cruz", items: 2, amount: 680, status: "completed", time: "15m ago" },
  { id: "#1039", customer: "Walk-in", items: 5, amount: 2150, status: "completed", time: "22m ago" },
  { id: "#1038", customer: "Mark Lopez", items: 1, amount: 450, status: "refunded", time: "35m ago" },
];

const lowStockItems = [
  { name: "Paracetamol 500mg", stock: 5, reorder: 50, category: "Medicine" },
  { name: "Premium Jasmine Rice", stock: 2, reorder: 20, category: "Rice" },
  { name: "Mineral Water 500ml", stock: 8, reorder: 30, category: "Beverage" },
  { name: "Cooking Oil 1L", stock: 3, reorder: 15, category: "Grocery" },
];

const topProducts = [
  { name: "Chicken Adobo Rice Bowl", sold: 142, revenue: 25560 },
  { name: "Premium Jasmine Rice (5kg)", sold: 98, revenue: 29400 },
  { name: "Bottled Water 500ml", sold: 215, revenue: 6450 },
  { name: "Coffee Americano", sold: 87, revenue: 13050 },
  { name: "Pork Sinigang Set", sold: 76, revenue: 22800 },
];

const staffActivity = [
  { name: "Maria C.", role: "Cashier", txns: 34, sales: 42800, status: "active" },
  { name: "Jose B.", role: "Cashier", txns: 28, sales: 36200, status: "active" },
  { name: "Ana R.", role: "Supervisor", txns: 12, sales: 18500, status: "break" },
  { name: "Mark L.", role: "Cashier", txns: 19, sales: 24100, status: "offline" },
];

function KPICard({
  label, value, change, positive, icon: Icon, gradient, sub,
}: {
  label: string; value: string; change: string; positive: boolean;
  icon: any; gradient: string; sub?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card rounded-2xl p-5 shadow-card border border-border"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-primary`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={cn(
          "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
          positive ? "text-success bg-success-muted" : "text-danger bg-danger-muted"
        )}>
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
    completed: "bg-success-muted text-success",
    processing: "bg-warning-muted text-warning",
    refunded: "bg-danger-muted text-danger",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", map[status] || "bg-secondary text-secondary-foreground")}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const { currentBusiness } = useApp();
  const cfg = BUSINESS_TYPE_CONFIG[currentBusiness.type];
  const BizIcon = cfg.icon;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className={`rounded-2xl bg-gradient-to-r ${cfg.gradient} p-5 flex items-center justify-between overflow-hidden relative`}>
          <div className="absolute right-0 top-0 w-64 h-full opacity-10">
            <div className="w-64 h-64 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <BizIcon className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">{cfg.label}</span>
            </div>
            <h2 className="text-white text-xl font-bold font-display">{currentBusiness.name}</h2>
            <p className="text-white/70 text-sm mt-0.5">Today, {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="relative z-10 text-right hidden sm:block">
            <p className="text-white/70 text-sm">Daily Target</p>
            <p className="text-white text-2xl font-bold font-display">₱ 50,000</p>
            <div className="mt-2 bg-white/20 rounded-full h-2 w-36">
              <div className="bg-white rounded-full h-2 w-3/4" />
            </div>
            <p className="text-white/70 text-xs mt-1">75% achieved</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Today's Revenue" value="₱ 37,840" change="+12.4%" positive gradient="from-blue-500 to-indigo-500" icon={DollarSign} sub="vs ₱ 33,670 yesterday" />
          <KPICard label="Total Orders" value="121" change="+8.2%" positive gradient="from-emerald-500 to-teal-500" icon={ShoppingCart} sub="Avg ₱ 312 / order" />
          <KPICard label="Items Sold" value="487" change="+5.1%" positive gradient="from-amber-500 to-orange-500" icon={Package} sub="Across 38 SKUs" />
          <KPICard label="Active Customers" value="94" change="-2.3%" positive={false} gradient="from-purple-500 to-violet-500" icon={Users} sub="12 new today" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Sales chart */}
          <div className="xl:col-span-2 bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground">Weekly Sales</h3>
                <p className="text-xs text-muted-foreground">Revenue & order volume</p>
              </div>
              <div className="flex gap-2">
                {["D", "W", "M"].map((t) => (
                  <button key={t} className={cn(
                    "text-xs px-2.5 py-1 rounded-lg font-medium transition-colors",
                    t === "W" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}>{t}</button>
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
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 89%)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`₱${v.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground">Category Split</h3>
                <p className="text-xs text-muted-foreground">Today's breakdown</p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {categoryData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-xs text-muted-foreground truncate">{c.name}</span>
                  <span className="text-xs font-semibold text-foreground ml-auto">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Recent orders */}
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
                <motion.div
                  key={o.id}
                  whileHover={{ backgroundColor: "hsl(220 14% 94%)" }}
                  className="grid grid-cols-5 items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-sm font-semibold text-primary">{o.id}</span>
                  <span className="text-sm text-foreground">{o.customer}</span>
                  <span className="text-sm text-center text-muted-foreground">{o.items}</span>
                  <span className="text-sm text-right font-semibold text-foreground">₱ {o.amount.toLocaleString()}</span>
                  <div className="text-right"><StatusBadge status={o.status} /></div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Low stock */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-warning-muted flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Low Stock Alerts</h3>
                <span className="ml-auto text-xs bg-warning-muted text-warning font-semibold px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
              </div>
              <div className="space-y-2.5">
                {lowStockItems.map((item) => (
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
                ))}
              </div>
            </div>

            {/* Staff activity */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary-muted flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Staff Activity</h3>
              </div>
              <div className="space-y-3">
                {staffActivity.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white text-xs font-bold">
                        {s.name[0]}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                        s.status === "active" ? "bg-success" : s.status === "break" ? "bg-warning" : "bg-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.role} · {s.txns} txns</p>
                    </div>
                    <p className="text-xs font-semibold text-foreground">₱{(s.sales / 1000).toFixed(1)}k</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top products bar chart */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground">Top Selling Products</h3>
              <p className="text-xs text-muted-foreground">Revenue contribution today</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-success-muted text-success px-2.5 py-1 rounded-full font-semibold">
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
                    <p className="text-xs font-semibold text-foreground">₱ {p.revenue.toLocaleString()}</p>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                      style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }}
                    />
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
