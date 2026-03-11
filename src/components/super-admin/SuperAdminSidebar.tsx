import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CircleDollarSign,
  Shield,
  LogOut,
  Zap,
  BookOpen,
  ShieldCheck,
  Briefcase,
  Bell,
  Plug,
  ChevronRight,
} from "lucide-react";
import type { SuperTab } from "./types";

type NavItem = {
  id: SuperTab;
  label: string;
  icon: any;
  badge?: string;
};

const NAV_GROUPS: Array<{ group: string; items: NavItem[] }> = [
  {
    group: "Platform",
    items: [
      { id: "overview",    label: "Overview",              icon: LayoutDashboard },
      { id: "businesses",  label: "Businesses",            icon: Building2 },
      { id: "users",       label: "All Users",             icon: Users },
      { id: "businesstype",label: "Business Types",        icon: Briefcase },
    ],
  },
  {
    group: "System",
    items: [
      { id: "systemmenu",   label: "System Menu",          icon: BookOpen },
      { id: "menuuserauth", label: "Menu Authorization",   icon: ShieldCheck },
    ],
  },
  {
    group: "Administration",
    items: [
      { id: "billing",       label: "Billing & Plans",     icon: CircleDollarSign },
      { id: "notifications", label: "Notifications",       icon: Bell,    badge: "3" },
      { id: "integrations",  label: "Integrations",        icon: Plug },
      { id: "settings",      label: "System Settings",     icon: Shield },
    ],
  },
];

export function SuperAdminSidebar({
  tab,
  onTabChange,
  onLogout,
}: {
  tab: SuperTab;
  onTabChange: (tab: SuperTab) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[#061126] lg:flex" style={{ minHeight: "100vh" }}>
      {/* Brand */}
      <div className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-[#061126] shadow-lg shadow-amber-500/20">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight text-white">BizPOS Pro</p>
            <p className="text-[11px] text-slate-500">Platform Control</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
          <Shield className="h-3 w-3" />
          System Owner
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ id, label, icon: Icon, badge }) => {
                  const isActive = tab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onTabChange(id)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-blue-300" />
                      )}
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                      <span className="flex-1 text-left">{label}</span>
                      {badge && (
                        <span className={cn(
                          "ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          isActive ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-300"
                        )}>
                          {badge}
                        </span>
                      )}
                      {!badge && !isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/[0.06] hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
