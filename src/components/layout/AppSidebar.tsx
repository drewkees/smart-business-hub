import { useApp } from "@/contexts/AppContext";
import { useLocation } from "react-router-dom";
import { SidebarNavLink } from "./SidebarNavLink";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, BarChart3,
  Users, Truck, Settings, UserCog, GitBranch, X,
  LogOut, ChevronRight, Building2, DollarSign, Shield, Activity, Zap,
} from "lucide-react";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";

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
  { to: "/inventory", label: "Inventory", icon: Package },
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
  { to: "/customers", label: "Customers", icon: Users },
];

const ROLE_BADGE: Record<string, { label: string; style: string }> = {
  owner: { label: "System Owner", style: "bg-warning/20 text-warning" },
  admin: { label: "Admin View", style: "bg-primary/20 text-primary-glow" },
  cashier: { label: "Cashier View", style: "bg-success/20 text-success" },
};

export function AppSidebar() {
<<<<<<< HEAD
  const { role, currentBusiness, currentBranch, logout, sidebarOpen, setSidebarOpen, isActivationPending } = useApp();
  const links = isActivationPending
    ? [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }]
    : role === "admin"
      ? ADMIN_LINKS
      : CASHIER_LINKS;
=======
  const { role, currentBusiness, currentBranch, logout, sidebarOpen, setSidebarOpen } = useApp();
  const links = role === "owner" ? OWNER_LINKS : role === "admin" ? ADMIN_LINKS : CASHIER_LINKS;
>>>>>>> e5ea5184f5aba375fa5cc9a7f3f39fa558a6b82c
  const location = useLocation();
  const isOwner = role === "owner";
  const bizConfig = !isOwner ? BUSINESS_TYPE_CONFIG[currentBusiness.type] : null;
  const badge = ROLE_BADGE[role];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16",
          "lg:relative lg:translate-x-0",
          !sidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
          !sidebarOpen && "lg:justify-center lg:px-2"
        )}>
          {isOwner ? (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-warning to-amber-400">
              <Zap className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              `bg-gradient-to-br ${bizConfig?.gradient}`
            )}>
              {bizConfig && <bizConfig.icon className="w-5 h-5 text-white" />}
            </div>
          )}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sidebar-foreground font-semibold text-sm truncate leading-tight">
                {isOwner ? "BizPOS Pro" : currentBusiness.name}
              </p>
              <p className="text-sidebar-accent-foreground/60 text-xs truncate">
                {isOwner ? "Platform Control" : currentBranch.name}
              </p>
            </motion.div>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
              badge.style
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
<<<<<<< HEAD
              {isActivationPending ? "Pending Activation" : role === "admin" ? "Admin View" : "Cashier View"}
=======
              {badge.label}
>>>>>>> e5ea5184f5aba375fa5cc9a7f3f39fa558a6b82c
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {sidebarOpen && (
            <p className="text-sidebar-foreground/30 text-[10px] uppercase tracking-widest font-semibold px-2 py-2">
              Navigation
            </p>
          )}
          {links.map(({ to, label, icon: Icon, end }) => {
            const isActive = end
              ? location.pathname === to
              : location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <SidebarNavLink
                key={to}
                to={to}
                end={end}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  !sidebarOpen && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </SidebarNavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive",
              !sidebarOpen && "lg:justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
