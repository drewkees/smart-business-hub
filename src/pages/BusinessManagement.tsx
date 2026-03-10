import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DEMO_BUSINESSES, Business } from "@/contexts/AppContext";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Building2, Plus, Search, MoreHorizontal, MapPin, GitBranch,
  CheckCircle2, XCircle, Edit3, Trash2, Eye, ChevronRight,
  DollarSign, Users, TrendingUp, Filter,
} from "lucide-react";

const STATUS_OPTIONS = ["All", "Active", "Suspended", "Trial"] as const;
const PLAN_OPTIONS = ["All Plans", "Starter", "Pro", "Enterprise"] as const;

const BIZ_META = [
  { status: "Active", plan: "Pro", users: 12, revenue: "₱842K", since: "Jan 2024" },
  { status: "Active", plan: "Enterprise", users: 8, revenue: "₱1.2M", since: "Mar 2023" },
  { status: "Active", plan: "Pro", users: 15, revenue: "₱654K", since: "Jun 2024" },
  { status: "Trial", plan: "Starter", users: 3, revenue: "₱98K", since: "Feb 2025" },
  { status: "Active", plan: "Starter", users: 5, revenue: "₱210K", since: "Aug 2024" },
];

const STATUS_STYLE: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Suspended: "bg-destructive/10 text-destructive",
  Trial: "bg-warning/10 text-warning",
};

const PLAN_STYLE: Record<string, string> = {
  Starter: "bg-muted text-muted-foreground",
  Pro: "bg-primary/10 text-primary",
  Enterprise: "bg-warning/10 text-warning",
};

export default function BusinessManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Business | null>(null);

  const filtered = DEMO_BUSINESSES.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const meta = BIZ_META[DEMO_BUSINESSES.indexOf(b)];
    const matchStatus = statusFilter === "All" || meta.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Business Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Register, manage, and monitor all platform tenants</p>
          </div>
          <button className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-primary hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" />
            Register Business
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Businesses", value: "5", icon: Building2, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active", value: "4", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
            { label: "Total Users", value: "43", icon: Users, color: "text-info", bg: "bg-info/10" },
            { label: "Platform MRR", value: "₱48K", icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold font-display text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search businesses..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Business List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            {["Business", "Type / Branches", "Plan", "Status", "Revenue", ""].map((h) => (
              <span key={h} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-border">
            {filtered.map((biz, i) => {
              const cfg = BUSINESS_TYPE_CONFIG[biz.type];
              const Icon = cfg.icon;
              const meta = BIZ_META[DEMO_BUSINESSES.indexOf(biz)];
              return (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Business name */}
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br", cfg.gradient)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{biz.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {biz.branches[0]?.location}
                        {meta.since && <span className="ml-2 opacity-60">Since {meta.since}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Type & branches */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{cfg.label} · {biz.branches.length} br.</span>
                  </div>

                  {/* Plan */}
                  <span className={cn("inline-flex w-fit px-2.5 py-1 rounded-full text-[11px] font-bold", PLAN_STYLE[meta.plan])}>
                    {meta.plan}
                  </span>

                  {/* Status */}
                  <span className={cn("inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-[11px] font-bold", STATUS_STYLE[meta.status])}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {meta.status}
                  </span>

                  {/* Revenue */}
                  <div>
                    <p className="text-sm font-bold text-foreground">{meta.revenue}</p>
                    <p className="text-[11px] text-muted-foreground">{meta.users} users</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No businesses found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
