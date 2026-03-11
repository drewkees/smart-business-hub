import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const HEADER_PROFILE_CACHE_KEY = "bizpos_header_profile_v1";

type HeaderProfileCache = {
  name: string;
  email: string;
};

function readHeaderProfileCache(): HeaderProfileCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HEADER_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HeaderProfileCache>;
    if (!parsed.name || !parsed.email) return null;
    return { name: parsed.name, email: parsed.email };
  } catch {
    return null;
  }
}

function writeHeaderProfileCache(value: HeaderProfileCache) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HEADER_PROFILE_CACHE_KEY, JSON.stringify(value));
}

export function AppHeader({ title }: { title?: string }) {
  const { sidebarOpen, setSidebarOpen, role, logout } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const cachedProfile = readHeaderProfileCache();
  const [userFullName, setUserFullName] = useState(cachedProfile?.name ?? "");
  const [userEmail, setUserEmail] = useState(cachedProfile?.email ?? "");

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (!mounted || error || !data.user) return;

      const email = data.user.email ?? "";
      const fullName = (data.user.user_metadata?.full_name as string | undefined)?.trim();
      const fallback = email ? email.split("@")[0] : role === "admin" ? "Admin User" : "Cashier User";

      const resolvedName = fullName || fallback;
      const resolvedEmail = email || userEmail || `${fallback}@bizpos.app`;

      setUserFullName(resolvedName);
      setUserEmail(resolvedEmail);
      writeHeaderProfileCache({ name: resolvedName, email: resolvedEmail });
    };
    void loadUser();
    return () => {
      mounted = false;
    };
  }, [role]);

  const notifications = [
    { id: 1, type: "warning", msg: "Low stock: Paracetamol (5 left)", time: "2m ago" },
    { id: 2, type: "info", msg: "New order #1042 received", time: "5m ago" },
    { id: 3, type: "success", msg: "Daily sales target reached!", time: "1h ago" },
    { id: 4, type: "warning", msg: "Rice (Premium) below reorder level", time: "2h ago" },
  ];

  const displayName = userFullName || (role === "admin" ? "Admin User" : "Cashier User");
  const displayEmail = userEmail || (role === "admin" ? "admin@bizpos.app" : "cashier@bizpos.app");

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 sticky top-0 z-30 shadow-card">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {title && <h1 className="text-base font-semibold text-foreground hidden sm:block">{title}</h1>}

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            setProfileOpen(false);
          }}
          className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-12 w-80 bg-card rounded-xl shadow-card-lg border border-border z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-semibold text-sm">Notifications</p>
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{notifications.length} new</span>
            </div>
            <div className="p-2 space-y-1">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      n.type === "warning" ? "bg-warning" : n.type === "success" ? "bg-success" : "bg-info",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.msg}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setProfileOpen(!profileOpen);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white text-sm font-bold">
            {role === "admin" ? "A" : "C"}
          </div>
          <div className="hidden sm:block text-left max-w-[140px]">
            <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
        </button>

        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-12 w-56 bg-card rounded-xl shadow-card-lg border border-border z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <p className="font-semibold text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>
            <div className="p-2">
              {[
                { icon: User, label: "Profile" },
                { icon: Settings, label: "Settings" },
                { icon: RefreshCw, label: "Switch Role" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </button>
              ))}
              <hr className="my-1 border-border" />
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
