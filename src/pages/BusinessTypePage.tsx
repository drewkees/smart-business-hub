import { cn } from "@/lib/utils";
import {
  UtensilsCrossed, ShoppingCart, Pill, Hammer, Scissors, Wheat, Package,
  CheckCircle2, Clock, Settings, Users, BarChart3, Shield, Globe, ChevronRight
} from "lucide-react";

type BizType = {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  features: string[];
  modules: string[];
  status: "live" | "beta" | "planned";
  totalBusinesses: number;
};

const BUSINESS_TYPES: BizType[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    icon: UtensilsCrossed,
    description: "Full-service dine-in, fast food, and cloud kitchen management with table layouts and KOT.",
    color: "text-orange-300",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/25",
    features: ["Table management", "Kitchen order tickets", "Split billing", "Reservation system"],
    modules: ["POS", "Orders", "Kitchen Display", "Tables", "Reports"],
    status: "live",
    totalBusinesses: 38,
  },
  {
    id: "rice",
    label: "Rice Trading",
    icon: Wheat,
    description: "Weight-based selling, sack management, bulk orders, and wholesale/delivery operations.",
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/25",
    features: ["Sack & weight selling", "Bulk pricing tiers", "Delivery tracking", "Supplier management"],
    modules: ["POS", "Inventory", "Suppliers", "Delivery", "Reports"],
    status: "live",
    totalBusinesses: 12,
  },
  {
    id: "retail",
    label: "Retail Store",
    icon: ShoppingCart,
    description: "General merchandise retail with barcode scanning, promotions, and inventory tracking.",
    color: "text-blue-300",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/25",
    features: ["Barcode scanning", "Discount & promo engine", "Stock alerts", "Multi-branch sync"],
    modules: ["POS", "Inventory", "Customers", "Promotions", "Reports"],
    status: "live",
    totalBusinesses: 54,
  },
  {
    id: "grocery",
    label: "Grocery",
    icon: Package,
    description: "Fresh produce and packaged goods management with expiry tracking and aisle layout.",
    color: "text-green-300",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/25",
    features: ["Expiry date tracking", "Aisle categorization", "Supplier invoices", "Reorder alerts"],
    modules: ["POS", "Inventory", "Suppliers", "Pricing", "Reports"],
    status: "live",
    totalBusinesses: 27,
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: Pill,
    description: "Medicine batch tracking, expiry alerts, prescription management, and compliance tools.",
    color: "text-violet-300",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/25",
    features: ["Batch & lot tracking", "Expiry alerts", "Prescription records", "Generic substitution"],
    modules: ["POS", "Dispensing", "Prescriptions", "Inventory", "Reports"],
    status: "live",
    totalBusinesses: 9,
  },
  {
    id: "hardware",
    label: "Hardware Store",
    icon: Hammer,
    description: "Construction materials, tools, and hardware with unit conversions and bulk pricing.",
    color: "text-slate-300",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/25",
    features: ["Unit conversion selling", "Bulk order pricing", "Project quotations", "Credit accounts"],
    modules: ["POS", "Inventory", "Quotes", "Accounts", "Reports"],
    status: "beta",
    totalBusinesses: 6,
  },
  {
    id: "salon",
    label: "Salon & Spa",
    icon: Scissors,
    description: "Appointment scheduling, staff assignment, service menus, and loyalty programs.",
    color: "text-pink-300",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/25",
    features: ["Appointment booking", "Staff assignment", "Service menu builder", "Loyalty points"],
    modules: ["Appointments", "POS", "Staff", "Customers", "Reports"],
    status: "live",
    totalBusinesses: 15,
  },
];

const STATUS_META = {
  live:    { label: "Live",    icon: CheckCircle2, class: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" },
  beta:    { label: "Beta",    icon: Clock,        class: "bg-amber-500/15 text-amber-300 border border-amber-500/30" },
  planned: { label: "Planned", icon: Settings,     class: "bg-slate-700 text-slate-400 border border-slate-600" },
};

export function BusinessTypePage() {
  const totalLive = BUSINESS_TYPES.filter((t) => t.status === "live").reduce((s, t) => s + t.totalBusinesses, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Business Types</h1>
        <p className="text-sm text-slate-400">Configure capabilities, modules, and features per business vertical.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Verticals",      value: BUSINESS_TYPES.length,                                             icon: Globe,    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Live Types",     value: BUSINESS_TYPES.filter((t) => t.status === "live").length,          icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Total Businesses", value: totalLive,                                                        icon: Users,    color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20" },
          { label: "Active Modules",   value: Array.from(new Set(BUSINESS_TYPES.flatMap((t) => t.modules))).length, icon: BarChart3, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
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

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const statusMeta = STATUS_META[type.status];
          const StatusIcon = statusMeta.icon;
          return (
            <div
              key={type.id}
              className={cn(
                "group relative overflow-hidden rounded-[24px] border bg-[#1a2436] p-5 transition hover:border-slate-600 hover:bg-[#1e2a42]",
                type.borderColor
              )}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", type.bgColor)}>
                  <Icon className={cn("h-5 w-5", type.color)} />
                </div>
                <span className={cn("mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", statusMeta.class)}>
                  <StatusIcon className="h-3 w-3" />
                  {statusMeta.label}
                </span>
              </div>

              {/* Info */}
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-white">{type.label}</h3>
                  <span className="text-xs text-slate-500">{type.totalBusinesses} businesses</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{type.description}</p>
              </div>

              {/* Features */}
              <div className="mt-4 space-y-1.5">
                {type.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                    <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", type.color.replace("text-", "bg-"))} />
                    {feat}
                  </div>
                ))}
              </div>

              {/* Modules */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {type.modules.map((mod) => (
                  <span key={mod} className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                    {mod}
                  </span>
                ))}
              </div>

              {/* Action */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-700/60 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Shield className="h-3.5 w-3.5" />
                    {type.modules.length} modules
                  </div>
                </div>
                <button className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white">
                  Configure
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
