import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadAccessFromCurrentSession } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type UserRole = "owner" | "admin" | "cashier";

export type BusinessType =
  | "restaurant"
  | "rice"
  | "retail"
  | "grocery"
  | "pharmacy"
  | "hardware"
  | "salon";

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  logoUrl?: string | null;
  branches: Branch[];
  activationStatus?: "pending" | "active" | "suspended";
  activationKey?: string;
}

interface AppContextValue {
  role: UserRole;
  setRole: (r: UserRole) => void;
  currentBusiness: Business;
  setCurrentBusiness: (b: Business) => void;
  currentBranch: Branch;
  setCurrentBranch: (b: Branch) => void;
  isLoggedIn: boolean;
  login: (role: UserRole, business?: Business) => void;
  logout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  businesses: Business[];
  isActivationPending: boolean;
  isAuthReady: boolean;
}

const DEMO_BUSINESSES: Business[] = [
  {
    id: "b1",
    name: "Flavor Hub Restaurant",
    type: "restaurant",
    branches: [
      { id: "br1", name: "Main Branch", location: "BGC, Taguig" },
      { id: "br2", name: "Mall Branch", location: "SM Megamall" },
    ],
  },
  {
    id: "b2",
    name: "Golden Rice Trading",
    type: "rice",
    branches: [
      { id: "br3", name: "Warehouse A", location: "Bulacan" },
      { id: "br4", name: "Retail Store", location: "Divisoria" },
    ],
  },
  {
    id: "b3",
    name: "FreshMart Grocery",
    type: "grocery",
    branches: [
      { id: "br5", name: "North Branch", location: "QC" },
      { id: "br6", name: "South Branch", location: "Alabang" },
    ],
  },
  {
    id: "b4",
    name: "MediCare Pharmacy",
    type: "pharmacy",
    branches: [{ id: "br7", name: "Main Store", location: "Makati" }],
  },
  {
    id: "b5",
    name: "StyleZone Salon",
    type: "salon",
    branches: [{ id: "br8", name: "SM Branch", location: "SM Mall of Asia" }],
  },
];

const AppContext = createContext<AppContextValue | null>(null);
const AUTH_CACHE_KEY = "bizpos_auth_cache_v1";

type AuthCache = {
  role: UserRole;
  business: Business;
  savedAt: number;
};

function readAuthCache(): AuthCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthCache>;
    if (!parsed || !parsed.role || !parsed.business || !Array.isArray(parsed.business.branches)) return null;
    return parsed as AuthCache;
  } catch {
    return null;
  }
}

function writeAuthCache(role: UserRole, business: Business) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    AUTH_CACHE_KEY,
    JSON.stringify({
      role,
      business,
      savedAt: Date.now(),
    } satisfies AuthCache)
  );
}

function clearAuthCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_CACHE_KEY);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const cachedAuth = readAuthCache();
  const [role, setRole] = useState<UserRole>(cachedAuth?.role ?? "admin");
  const [currentBusiness, setCurrentBusiness] = useState<Business>(cachedAuth?.business ?? DEMO_BUSINESSES[0]);
  const [currentBranch, setCurrentBranch] = useState<Branch>(cachedAuth?.business?.branches?.[0] ?? DEMO_BUSINESSES[0].branches[0]);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(cachedAuth));
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function buildActivationKey(businessId: string) {
    return `ACT-${businessId.split("-")[0].toUpperCase()}`;
  }

  function applyAccess(r: UserRole, business?: Business) {
    const resolvedBusiness = business ?? DEMO_BUSINESSES[0];
    const normalizedBusiness: Business = {
      ...resolvedBusiness,
      activationStatus: resolvedBusiness.activationStatus ?? "active",
      activationKey: resolvedBusiness.activationKey ?? buildActivationKey(resolvedBusiness.id),
      branches: resolvedBusiness.branches?.length ? resolvedBusiness.branches : [{ id: "main", name: "Main Branch", location: "N/A" }],
    };

    setRole(r);
    setCurrentBusiness(normalizedBusiness);
    setCurrentBranch(normalizedBusiness.branches[0]);
    setIsLoggedIn(true);
    writeAuthCache(r, normalizedBusiness);
  }

  function login(r: UserRole, business?: Business) {
    applyAccess(r, business);
  }

  function logout() {
    clearAuthCache();
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signOut();
    }
    setIsLoggedIn(false);
  }

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) return;
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session?.user) return;

        const access = await loadAccessFromCurrentSession();
        if (!mounted || !access) return;
        applyAccess(access.role, access.business);
      } catch {
        clearAuthCache();
        if (mounted) setIsLoggedIn(false);
      } finally {
        if (mounted) setIsAuthReady(true);
      }
    };

    const { data: authListener } = isSupabaseConfigured && supabase
      ? supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          if (!session?.user || event === "SIGNED_OUT") {
            clearAuthCache();
            setIsLoggedIn(false);
          }
        })
      : { data: { subscription: { unsubscribe: () => undefined } } };

    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
    } else {
      void restore();
    }

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentBusiness,
        setCurrentBusiness,
        currentBranch,
        setCurrentBranch,
        isLoggedIn,
        login,
        logout,
        sidebarOpen,
        setSidebarOpen,
        businesses: DEMO_BUSINESSES,
        isActivationPending: role !== "owner" && (currentBusiness.activationStatus ?? "active") !== "active",
        isAuthReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { DEMO_BUSINESSES };
