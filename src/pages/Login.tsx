import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, UserRole, Business, DEMO_BUSINESSES } from "@/contexts/AppContext";
import { BUSINESS_TYPE_CONFIG } from "@/lib/businessConfig";
import { cn } from "@/lib/utils";
import { registerBusinessOwner, sendPasswordReset, signInWithEmailPassword } from "@/lib/auth";
import {
  ShieldCheck, User, ChevronRight, Store, ArrowLeft,
<<<<<<< HEAD
  Zap, Globe, Building2,
  Upload, X, Check, UserPlus, KeyRound,
  Camera,
=======
  Zap, Globe, Crown,
>>>>>>> e5ea5184f5aba375fa5cc9a7f3f39fa558a6b82c
} from "lucide-react";

type Tab = "login" | "register";
type RegisterStep = "business" | "account";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail Store" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "grocery", label: "Grocery" },
  { value: "hardware", label: "Hardware" },
  { value: "salon", label: "Salon & Services" },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("business");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

<<<<<<< HEAD
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    businessName: "",
    businessType: "",
    location: "",
    email: "",
    phone: "",
    logo: null as File | null,
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegisterForm(f => ({ ...f, logo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
=======
  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    if (role === "owner") {
      // Owner doesn't need to pick a business — log in directly
      login(role, DEMO_BUSINESSES[0]);
      navigate("/");
    } else {
      setStep("business");
    }
>>>>>>> e5ea5184f5aba375fa5cc9a7f3f39fa558a6b82c
  }

  function handleDemoLogin() {
    setAuthError(null);
    setAuthInfo(null);
    login("admin", DEMO_BUSINESSES[0]);
    navigate("/");
  }

  async function handleSignIn() {
    if (!loginForm.email || !loginForm.password) {
      setAuthError("Enter email and password.");
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      setAuthInfo(null);
      const result = await signInWithEmailPassword(loginForm.email.trim(), loginForm.password);
      login(result.role, result.business);
      navigate(result.role === "cashier" ? "/pos" : "/");
    } catch (error: any) {
      setAuthError(error?.message || "Unable to sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!loginForm.email) {
      setAuthError("Enter your email first, then click Forgot password.");
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      setAuthInfo(null);
      await sendPasswordReset(loginForm.email.trim());
      setAuthInfo("Password reset email sent.");
    } catch (error: any) {
      setAuthError(error?.message || "Failed to send reset email.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegisterSubmit() {
    if (!registerForm.ownerName || !registerForm.ownerEmail || !registerForm.ownerPassword) return;

    try {
      setAuthLoading(true);
      setAuthError(null);
      setAuthInfo(null);
      await registerBusinessOwner(registerForm);
      setSubmitted(true);
    } catch (error: any) {
      setAuthError(error?.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  const inputClass = `
    w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground
    placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60
    focus:ring-2 focus:ring-primary/10 transition-all duration-200
  `;

  const step1Valid = registerForm.businessName && registerForm.businessType && registerForm.location && registerForm.email;

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── LEFT PANEL (unchanged) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sidebar flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-glow rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl font-display">BizPOS Pro</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white font-display leading-tight">
              One system for<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-300">
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

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg font-display">BizPOS Pro</span>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-8 border border-border">
            {([["login", KeyRound, "Sign In"], ["register", UserPlus, "Register Business"]] as const).map(([t, Icon, label]) => (
              <button
                key={t}
                onClick={() => { setTab(t); setRegisterStep("business"); setSubmitted(false); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  tab === t
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                </span>
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── LOGIN TAB ── */}
            {tab === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="text-2xl font-bold font-display text-foreground">Welcome back</h1>
                  <p className="text-muted-foreground text-sm mt-1">Sign in to your BizPOS account</p>
                </div>

                {authError && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{authError}</p>}
                {authInfo && <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">{authInfo}</p>}

                <div className="space-y-3">
<<<<<<< HEAD
                  <input
                    type="email"
                    placeholder="Email address"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    className={cn(inputClass, "h-11 px-4")}
=======
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
>>>>>>> e5ea5184f5aba375fa5cc9a7f3f39fa558a6b82c
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    className={cn(inputClass, "h-11 px-4")}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    Remember me
                  </label>
                  <button onClick={handleForgotPassword} className="text-primary hover:underline font-medium">Forgot password?</button>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm gradient-primary text-white shadow-primary hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} />
                  {authLoading ? "Signing In..." : "Sign In"}
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  onClick={handleDemoLogin}
                  className="w-full py-3 rounded-xl font-medium text-sm border-2 border-border bg-card hover:border-primary/40 text-foreground transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-primary" />
                  Continue with Demo Account
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  New business?{" "}
                  <button onClick={() => setTab("register")} className="text-primary font-semibold hover:underline">
                    Register here
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── REGISTER TAB ── */}
            {tab === "register" && !submitted && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-6">
                  {(["business", "account"] as RegisterStep[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                        registerStep === s
                          ? "gradient-primary text-white shadow-primary"
                          : registerStep === "account" && s === "business"
                            ? "bg-success/20 text-success border-2 border-success/40"
                            : "bg-secondary text-muted-foreground border-2 border-border"
                      )}>
                        {registerStep === "account" && s === "business" ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-xs font-semibold", registerStep === s ? "text-foreground" : "text-muted-foreground")}>
                          {s === "business" ? "Business Info" : "Owner Account"}
                        </p>
                      </div>
                      {i < 1 && <div className={cn("w-8 h-px flex-shrink-0", registerStep === "account" ? "bg-success/40" : "bg-border")} />}
                    </div>
                  ))}
                </div>

                {authError && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{authError}</p>}
                {authInfo && <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">{authInfo}</p>}

                <AnimatePresence mode="wait">
                  {/* STEP 1: Business Info */}
                  {registerStep === "business" && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div>
                        <h1 className="text-2xl font-bold font-display text-foreground">Register your business</h1>
                        <p className="text-muted-foreground text-sm mt-1">Tell us about your business</p>
                      </div>

                      {/* Logo upload */}
                      <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                        <p className="text-sm font-semibold text-foreground">Business Logo</p>
                        <p className="mt-1 text-xs text-muted-foreground">Use a square logo for best display quality. PNG or JPG up to 2MB.</p>

                        <div className="mt-3 flex items-center gap-4">
                          <div
                            className={cn(
                              "relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-dashed bg-card",
                              logoPreview ? "border-primary/40" : "border-border"
                            )}
                          >
                            {logoPreview ? (
                              <img src={logoPreview} alt="Business logo preview" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="group cursor-pointer inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:from-primary/15 hover:to-primary/10 hover:shadow-md active:translate-y-0">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 group-hover:bg-primary/20 transition-colors">
                                <Upload className="h-3.5 w-3.5" />
                              </span>
                              {logoPreview ? "Replace Logo" : "Upload Logo"}
                              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            </label>

                            {logoPreview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoPreview(null);
                                  setRegisterForm((f) => ({ ...f, logo: null }));
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                                Remove logo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Business Name */}
                      <input
                        placeholder="Business name"
                        value={registerForm.businessName}
                        onChange={e => setRegisterForm(f => ({ ...f, businessName: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      {/* Business Type */}
                      <select
                        value={registerForm.businessType}
                        onChange={e => setRegisterForm(f => ({ ...f, businessType: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4 appearance-none cursor-pointer")}
                      >
                        <option value="" disabled>Business type</option>
                        {BUSINESS_TYPES.map(bt => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>

                      {/* Location */}
                      <input
                        placeholder="Business location / address"
                        value={registerForm.location}
                        onChange={e => setRegisterForm(f => ({ ...f, location: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      {/* Email */}
                      <input
                        type="email"
                        placeholder="Business email"
                        value={registerForm.email}
                        onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      {/* Phone */}
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={registerForm.phone}
                        onChange={e => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      <button
                        onClick={() => step1Valid && setRegisterStep("account")}
                        disabled={!step1Valid}
                        className={cn(
                          "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                          step1Valid
                            ? "gradient-primary text-white shadow-primary hover:shadow-lg"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        Continue to Owner Account
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <p className="text-center text-xs text-muted-foreground">
                        Already registered?{" "}
                        <button onClick={() => setTab("login")} className="text-primary font-semibold hover:underline">Sign in</button>
                      </p>
                    </motion.div>
                  )}

                  {/* STEP 2: Owner Account */}
                  {registerStep === "account" && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-2xl font-bold font-display text-foreground">Owner account</h1>
                          <p className="text-muted-foreground text-sm mt-1">Set your login credentials</p>
                        </div>
                        <button
                          onClick={() => setRegisterStep("business")}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                      </div>

                      {/* Business summary pill */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                        {logoPreview
                          ? <img src={logoPreview} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{registerForm.businessName}</p>
                          <p className="text-xs text-muted-foreground truncate">{registerForm.businessType} · {registerForm.location}</p>
                        </div>
                        <button onClick={() => setRegisterStep("business")} className="ml-auto text-muted-foreground hover:text-foreground flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        placeholder="Your full name"
                        value={registerForm.ownerName}
                        onChange={e => setRegisterForm(f => ({ ...f, ownerName: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      <input
                        type="email"
                        placeholder="Your email (login email)"
                        value={registerForm.ownerEmail}
                        onChange={e => setRegisterForm(f => ({ ...f, ownerEmail: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      <input
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.ownerPassword}
                        onChange={e => setRegisterForm(f => ({ ...f, ownerPassword: e.target.value }))}
                        className={cn(inputClass, "h-11 px-4")}
                      />

                      {/* Password strength */}
                      {registerForm.ownerPassword && (
                        <div className="space-y-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={cn(
                                "flex-1 h-1 rounded-full transition-all",
                                registerForm.ownerPassword.length >= i * 3
                                  ? i <= 1 ? "bg-destructive" : i <= 2 ? "bg-warning" : i <= 3 ? "bg-primary" : "bg-success"
                                  : "bg-border"
                              )} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {registerForm.ownerPassword.length < 4 ? "Too short" : registerForm.ownerPassword.length < 7 ? "Weak" : registerForm.ownerPassword.length < 10 ? "Good" : "Strong"}
                          </p>
                        </div>
                      )}

                        <button
                          onClick={handleRegisterSubmit}
                          type="button"
                          disabled={authLoading || !registerForm.ownerName || !registerForm.ownerEmail || !registerForm.ownerPassword}
                          className={cn(
                            "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                            !authLoading && registerForm.ownerName && registerForm.ownerEmail && registerForm.ownerPassword
                              ? "gradient-primary text-white shadow-primary hover:shadow-lg"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          )}
                        >
                          <UserPlus className="w-4 h-4" />
                        {authLoading ? "Submitting..." : "Submit Registration"}
                        </button>

                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        By registering, your business will be reviewed and approved by our team within 24 hours.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── SUCCESS STATE ── */}
            {tab === "register" && submitted && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-5 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center mx-auto"
                >
                  <Check className="w-10 h-10 text-success" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold font-display text-foreground">Registration Submitted!</h2>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                    <span className="font-semibold text-foreground">{registerForm.businessName}</span> is saved with status <span className="text-primary">pending activation</span>. You can sign in once it is set to active.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary border border-border text-left space-y-2">
                  {[
                    ["Business", registerForm.businessName],
                    ["Type", BUSINESS_TYPES.find(b => b.value === registerForm.businessType)?.label || "-"],
                    ["Location", registerForm.location],
                    ["Contact", registerForm.email],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setTab("login");
                    setSubmitted(false);
                    setRegisterStep("business");
                    setAuthError(null);
                    setAuthInfo(null);
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-sm gradient-primary text-white shadow-primary flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Back to Sign In
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
