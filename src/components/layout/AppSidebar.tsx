import { useApp } from "@/contexts/AppContext";
import { useLocation } from "react-router-dom";
import { SidebarNavLink } from "./SidebarNavLink";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  DollarSign,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";

const AUTH_CACHE_KEY = "bizpos_auth_cache_v1";

type SidebarAuthCache = {
  business?: {
    name?: string;
    logoUrl?: string | null;
    branches?: Array<{ name?: string }>;
  };
};

function readSidebarAuthCache(): SidebarAuthCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SidebarAuthCache;
  } catch {
    return null;
  }
}

const OWNER_LINKS = [
  { to: "/", label: "System Overview", icon: Activity, end: true },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/platform-users", label: "All Users", icon: Users },
  { to: "/billing", label: "Billing & Plans", icon: DollarSign },
  { to: "/system-settings", label: "System Settings", icon: Shield },
];

const ADMIN_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pos", label: "POS / Cashier", icon: ShoppingCart },
  { to: "/items", label: "Items", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/item-categories", label: "Item Categories", icon: Package },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/staff", label: "Staff & Roles", icon: UserCog },
  { to: "/branches", label: "Branches", icon: GitBranch },
  { to: "/settings", label: "Settings", icon: Settings },
];

const CASHIER_LINKS = [
  { to: "/pos", label: "POS Checkout", icon: ShoppingCart, end: true },
  { to: "/orders", label: "Transactions", icon: ClipboardList },
];

const ROLE_BADGE: Record<string, { label: string; style: string }> = {
  owner: { label: "System Owner", style: "bg-warning/20 text-warning" },
  admin: { label: "Admin View", style: "bg-primary/20 text-primary-glow" },
  cashier: { label: "Cashier View", style: "bg-success/20 text-success" },
};

export function AppSidebar() {
  const { role, currentBusiness, currentBranch, logout, sidebarOpen, setSidebarOpen, isActivationPending } = useApp();
  const cached = readSidebarAuthCache();
  const links = role === "owner"
    ? OWNER_LINKS
    : isActivationPending
      ? [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }]
      : role === "admin"
        ? ADMIN_LINKS
        : CASHIER_LINKS;

  const location = useLocation();
  const isOwner = role === "owner";
  const badge = ROLE_BADGE[role];
  const bizConfig = !isOwner ? BUSINESS_TYPE_CONFIG[currentBusiness.type] : null;
  const BizIcon = bizConfig?.icon;
  const displayBusinessName = currentBusiness.name || cached?.business?.name || "Business";
  const displayBranchName = currentBranch.name || cached?.business?.branches?.[0]?.name || "Main Branch";
  const displayLogoUrl = currentBusiness.logoUrl || cached?.business?.logoUrl || null;

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16",
          "lg:relative lg:translate-x-0",
          !sidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex items-center gap-3 border-b border-sidebar-border px-4 py-5", !sidebarOpen && "lg:justify-center lg:px-2")}>
          {isOwner ? (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warning to-amber-400">
              <Zap className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl", `bg-gradient-to-br ${bizConfig?.gradient}`)}>
              {displayLogoUrl ? (
                <img src={displayLogoUrl} alt="Business logo" className="h-full w-full object-cover" />
              ) : BizIcon ? (
                <BizIcon className="h-5 w-5 text-white" />
              ) : null}
            </div>
          )}
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                {isOwner ? "BizPOS Pro" : displayBusinessName}
              </p>
              <p className="truncate text-xs text-sidebar-accent-foreground/60">
                {isOwner ? "Platform Control" : displayBranchName}
              </p>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", badge.style)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isActivationPending ? "Pending Activation" : badge.label}
            </span>
          </div>
        )}

        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {sidebarOpen && <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">Navigation</p>}
          {links.map(({ to, label, icon: Icon, end }) => {
            const isActive = end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <SidebarNavLink
                key={to}
                to={to}
                end={end}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150",
                  !sidebarOpen && "lg:justify-center lg:px-2",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
              </SidebarNavLink>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150",
              "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive",
              !sidebarOpen && "lg:justify-center"
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
