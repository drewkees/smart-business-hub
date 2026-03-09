import { AppLayout } from "@/components/layout/AppLayout";
import { Settings as SettingsIcon, Store, Bell, Lock, Users, Palette } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout title="Settings">
      <div className="max-w-3xl space-y-4">
        {[
          { icon: Store, label: "Business Profile", desc: "Name, address, logo, business type", color: "from-blue-500 to-indigo-500" },
          { icon: Users, label: "User & Role Management", desc: "Manage staff accounts and permissions", color: "from-purple-500 to-violet-500" },
          { icon: Bell, label: "Notifications", desc: "Low stock alerts, order updates, reports", color: "from-amber-500 to-orange-400" },
          { icon: Lock, label: "Security", desc: "Password policy, 2FA, session settings", color: "from-rose-500 to-red-400" },
          { icon: Palette, label: "Appearance", desc: "Theme, color scheme, layout preferences", color: "from-teal-500 to-cyan-400" },
          { icon: SettingsIcon, label: "POS Configuration", desc: "Receipt format, tax settings, payment methods", color: "from-slate-500 to-zinc-400" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <button key={label} className="w-full bg-card rounded-2xl p-5 shadow-card border border-border flex items-center gap-4 hover:shadow-card-md hover:border-primary/30 transition-all text-left group">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary transition-colors" />
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
