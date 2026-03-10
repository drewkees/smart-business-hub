import { useApp, DEMO_BUSINESSES } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Building2, TrendingUp, Users, DollarSign, ShoppingCart,
  AlertCircle, CheckCircle2, Activity, ArrowUpRight, MoreHorizontal,
  Globe, Server, Shield, Zap,
} from "lucide-react";

const PLATFORM_STATS = [
  { label: "Total Businesses", value: "5", change: "+2 this month", icon: Building2, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Branches", value: "9", change: "+1 this week", icon: Globe, color: "text-success", bg: "bg-success/10" },
  { label: "Platform Revenue", value: "₱2.4M", change: "+18.2% vs last mo.", icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
  { label: "Total Users", value: "47", change: "+5 this month", icon: Users, color: "text-info", bg: "bg-info/10" },
];

const SYSTEM_HEALTH = [
  { label: "API Uptime", value: "99.98%", status: "ok" },
  { label: "Database", value: "Healthy", status: "ok" },
  { label: "Storage", value: "42% used", status: "warn" },
  { label: "Auth Service", value: "Online", status: "ok" },
];

const RECENT_ACTIVITY = [
  { biz: "Flavor Hub Restaurant", action: "New branch added", time: "2 min ago", type: "info" },
  { biz: "MediCare Pharmacy", action: "Monthly subscription renewed", time: "1 hr ago", type: "success" },
  { biz: "Golden Rice Trading", action: "Inventory alert triggered", time: "3 hrs ago", type: "warn" },
  { biz: "FreshMart Grocery", action: "Admin account created", time: "5 hrs ago", type: "info" },
  { biz: "StyleZone Salon", action: "Plan upgraded to Pro", time: "Yesterday", type: "success" },
];

const PLAN_COLORS: Record<string, string> = {
  Starter: "bg-muted text-muted-foreground",
  Pro: "bg-primary/10 text-primary",
  Enterprise: "bg-warning/10 text-warning",
};

const BIZ_PLANS = ["Pro", "Enterprise", "Starter", "Pro", "Starter"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function SystemDashboard() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">System Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Platform-wide health, metrics, and business registry</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-success">All Systems Operational</span>
          </div>
        </motion.div>

        {/* Platform KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORM_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
              <p className="text-[11px] text-success font-medium">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Business Registry */}
          <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground text-sm">Registered Businesses</h2>
                <p className="text-xs text-muted-foreground">All tenants on this platform</p>
              </div>
              <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                Manage all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {DEMO_BUSINESSES.map((biz, i) => {
                const cfg = BUSINESS_TYPE_CONFIG[biz.type];
                const Icon = cfg.icon;
                const plan = BIZ_PLANS[i];
                return (
                  <div key={biz.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br", cfg.gradient)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{biz.name}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label} · {biz.branches.length} {biz.branches.length === 1 ? "branch" : "branches"}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", PLAN_COLORS[plan])}>
                      {plan}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-[11px] text-muted-foreground">Active</span>
                    </div>
                    <button className="text-muted-foreground/40 hover:text-muted-foreground p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="space-y-4">
            {/* System Health */}
            <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.15 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">System Health</h2>
              </div>
              <div className="p-4 space-y-2.5">
                {SYSTEM_HEALTH.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      {item.status === "ok"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        : <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      }
                      <span className={cn("text-xs font-semibold", item.status === "ok" ? "text-success" : "text-warning")}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.2 }} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Recent Activity</h2>
              </div>
              <div className="p-3 space-y-1">
                {RECENT_ACTIVITY.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                      act.type === "success" ? "bg-success" : act.type === "warn" ? "bg-warning" : "bg-info"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{act.biz}</p>
                      <p className="text-[11px] text-muted-foreground">{act.action}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">{act.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick actions */}
        <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.25 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Register Business", icon: Building2, desc: "Onboard a new tenant", color: "text-primary", bg: "bg-primary/10" },
            { label: "Manage Users", icon: Users, desc: "Platform-wide accounts", color: "text-info", bg: "bg-info/10" },
            { label: "Billing & Plans", icon: DollarSign, desc: "Subscriptions & invoices", color: "text-warning", bg: "bg-warning/10" },
            { label: "System Settings", icon: Shield, desc: "Security & configuration", color: "text-success", bg: "bg-success/10" },
          ].map((action) => (
            <button key={action.label} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-card-md transition-all text-left">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", action.bg)}>
                <action.icon className={cn("w-4 h-4", action.color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-[11px] text-muted-foreground">{action.desc}</p>
              </div>
            </button>
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
}
