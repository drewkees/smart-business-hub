import { cn } from "@/lib/utils";
import { Building2, CircleDollarSign, LayoutDashboard, LogOut, Shield, Users, Zap } from "lucide-react";
import type { SuperTab } from "./types";

const TABS: Array<{ id: SuperTab; label: string; icon: any }> = [
  { id: "overview", label: "System Overview", icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", icon: Building2 },
  { id: "users", label: "All Users", icon: Users },
  { id: "systemmenu", label: "System Menu", icon: CircleDollarSign },
  { id: "menuuserauth", label: "Menu User Authorization", icon: Users },
  { id: "billing", label: "Billing & Plans", icon: CircleDollarSign },
  { id: "settings", label: "System Settings", icon: Shield },
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
    <aside className="hidden w-64 shrink-0 bg-[#061126] text-slate-200 lg:flex lg:flex-col">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-400 text-[#061126]">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-white">BizPOS Pro</p>
            <p className="text-xs text-slate-400">Platform Control</p>
          </div>
        </div>
        <span className="mt-4 inline-flex rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300">System Owner</span>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
        <div className="space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                tab === id ? "bg-blue-600 text-white shadow-[0_8px_24px_-16px_rgba(37,99,235,1)]" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
