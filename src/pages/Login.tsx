import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, UserRole, Business, DEMO_BUSINESSES } from "@/contexts/AppContext";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, User, ChevronRight, Store, ArrowLeft,
  Zap, Globe, Crown,
} from "lucide-react";

type Step = "role" | "business";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    if (role === "owner") {
      // Owner doesn't need to pick a business — log in directly
      login(role, DEMO_BUSINESSES[0]);
      navigate("/");
    } else {
      setStep("business");
    }
  }

  function handleLogin() {
    if (!selectedRole || !selectedBusiness) return;
    login(selectedRole, selectedBusiness);
    if (selectedRole === "cashier") {
      navigate("/pos");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sidebar flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl font-display">BizPOS Pro</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white font-display leading-tight">
              One system for<br />
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-300">
                every business
              </span>
            </h2>
            <p className="mt-4 text-sidebar-foreground/70 text-lg leading-relaxed">
              A modern, role-based POS built for restaurants, retail, pharmacies, and more — all in one unified platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(BUSINESS_TYPE_CONFIG) as any[]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-2.5 bg-sidebar-accent rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sidebar-foreground/80 text-sm font-medium">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sidebar-foreground/40 text-xs">
          <Globe className="w-3.5 h-3.5" />
          <span>Enterprise-grade · Multi-branch · Role-based access</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-lg font-display">BizPOS Pro</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "role" && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-bold font-display text-foreground">Welcome back</h1>
                  <p className="text-muted-foreground mt-2">Select your role to continue</p>
                </div>

                <div className="space-y-3">
                  <RoleCard
                    icon={Crown}
                    role="owner"
                    title="System Owner"
                    description="Platform-level control. Manage all registered businesses, users, billing, subscriptions, and global system configuration."
                    gradient="from-amber-500 to-orange-500"
                    badge="Platform Admin"
                    badgeColor="bg-warning/10 text-warning"
                    perms={["All Businesses", "Billing & Plans", "Platform Users", "System Config"]}
                    onClick={() => handleRoleSelect("owner")}
                  />
                  <RoleCard
                    icon={ShieldCheck}
                    role="admin"
                    title="Business Admin"
                    description="Full dashboard access, analytics, reports, multi-branch control, user management, and business settings."
                    gradient="from-blue-600 to-indigo-600"
                    badge="Full Access"
                    badgeColor="bg-primary/10 text-primary"
                    perms={["Dashboard & Analytics", "Inventory & Products", "Staff & Roles", "Business Settings"]}
                    onClick={() => handleRoleSelect("admin")}
                  />
                  <RoleCard
                    icon={User}
                    role="cashier"
                    title="Cashier"
                    description="Fast POS checkout screen, transaction history, customer lookup, and receipt management."
                    gradient="from-emerald-500 to-teal-500"
                    badge="POS Access"
                    badgeColor="bg-success/10 text-success"
                    perms={["POS Checkout", "Transaction History", "Customer Lookup", "Discounts & Receipts"]}
                    onClick={() => handleRoleSelect("cashier")}
                  />
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  Demo environment — No credentials required
                </p>
              </motion.div>
            )}

            {step === "business" && (
              <motion.div
                key="business"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => setStep("role")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to role selection
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      selectedRole === "admin" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                    )}>
                      {selectedRole === "admin" ? "Administrator" : "Cashier"}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold font-display text-foreground">Choose your business</h1>
                  <p className="text-muted-foreground mt-1">The UI will adapt to your business type</p>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {DEMO_BUSINESSES.map((biz) => {
                    const Icon = BUSINESS_TYPE_CONFIG[biz.type].icon;
                    const cfg = BUSINESS_TYPE_CONFIG[biz.type];
                    return (
                      <motion.button
                        key={biz.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedBusiness(biz)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
                          selectedBusiness?.id === biz.id
                            ? "border-primary bg-primary/5 shadow-primary"
                            : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50"
                        )}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{biz.name}</p>
                          <p className="text-xs text-muted-foreground">{cfg.label} · {biz.branches.length} branches</p>
                        </div>
                        {selectedBusiness?.id === biz.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M10 3L5 8L2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  onClick={handleLogin}
                  disabled={!selectedBusiness}
                  whileHover={selectedBusiness ? { scale: 1.02 } : {}}
                  whileTap={selectedBusiness ? { scale: 0.98 } : {}}
                  className={cn(
                    "w-full mt-4 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                    selectedBusiness
                      ? "gradient-primary text-white shadow-primary hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Store className="w-4 h-4" />
                  Enter {selectedRole === "admin" ? "Dashboard" : "POS Screen"}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon, title, description, gradient, badge, badgeColor, perms, onClick,
}: {
  icon: any; role: string; title: string; description: string;
  gradient: string; badge: string; badgeColor: string;
  perms: string[]; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-card-md text-left transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-primary`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-foreground">{title}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
          <div className="flex flex-wrap gap-1.5">
            {perms.map((p) => (
              <span key={p} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium">{p}</span>
            ))}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
      </div>
    </motion.button>
  );
}
