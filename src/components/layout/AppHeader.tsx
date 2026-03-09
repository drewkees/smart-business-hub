import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Menu, Bell, Search, ChevronDown, Building2, MapPin,
  User, Settings, LogOut, RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";

export function AppHeader({ title }: { title?: string }) {
  const {
    sidebarOpen, setSidebarOpen, currentBusiness, setCurrentBusiness,
    currentBranch, setCurrentBranch, businesses, role, logout,
  } = useApp();
  const [bizOpen, setBizOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const BizIcon = BUSINESS_TYPE_CONFIG[currentBusiness.type].icon;
  const bizGradient = BUSINESS_TYPE_CONFIG[currentBusiness.type].gradient;

  const notifications = [
    { id: 1, type: "warning", msg: "Low stock: Paracetamol (5 left)", time: "2m ago" },
    { id: 2, type: "info", msg: "New order #1042 received", time: "5m ago" },
    { id: 3, type: "success", msg: "Daily sales target reached!", time: "1h ago" },
    { id: 4, type: "warning", msg: "Rice (Premium) below reorder level", time: "2h ago" },
  ];

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 sticky top-0 z-30 shadow-card">
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="text-base font-semibold text-foreground hidden sm:block">{title}</h1>
      )}

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 w-56">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search anything..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
        <kbd className="text-[10px] text-muted-foreground bg-background rounded px-1.5 py-0.5 border border-border">⌘K</kbd>
      </div>

      {/* Business switcher (admin only) */}
      {role === "admin" && (
        <div className="relative">
          <button
            onClick={() => { setBizOpen(!bizOpen); setProfileOpen(false); setNotifOpen(false); }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors border border-border"
          >
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${bizGradient} flex items-center justify-center`}>
              <BizIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground leading-none">{currentBusiness.name}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5" /> {currentBranch.name}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {bizOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-12 w-72 bg-card rounded-xl shadow-card-lg border border-border z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Switch Business</p>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto scrollbar-thin">
                {businesses.map((biz) => {
                  const Icon = BUSINESS_TYPE_CONFIG[biz.type].icon;
                  const grad = BUSINESS_TYPE_CONFIG[biz.type].gradient;
                  return (
                    <div key={biz.id} className="rounded-lg overflow-hidden mb-1">
                      <button
                        onClick={() => {
                          setCurrentBusiness(biz);
                          setCurrentBranch(biz.branches[0]);
                          setBizOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                          currentBusiness.id === biz.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary text-foreground"
                        )}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{biz.name}</p>
                          <p className="text-xs text-muted-foreground">{BUSINESS_TYPE_CONFIG[biz.type].label} · {biz.branches.length} branches</p>
                        </div>
                      </button>
                      {currentBusiness.id === biz.id && (
                        <div className="pl-14 pb-2 space-y-0.5">
                          {biz.branches.map((br) => (
                            <button
                              key={br.id}
                              onClick={() => { setCurrentBranch(br); setBizOpen(false); }}
                              className={cn(
                                "w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-2",
                                currentBranch.id === br.id
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                            >
                              <MapPin className="w-3 h-3" />
                              {br.name} — {br.location}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); setBizOpen(false); }}
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
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    n.type === "warning" ? "bg-warning" : n.type === "success" ? "bg-success" : "bg-info"
                  )} />
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

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setBizOpen(false); }}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white text-sm font-bold">
            {role === "admin" ? "A" : "C"}
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
              <p className="font-semibold text-sm">{role === "admin" ? "Admin User" : "Cashier User"}</p>
              <p className="text-xs text-muted-foreground">{role === "admin" ? "admin@bizpos.app" : "cashier@bizpos.app"}</p>
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
