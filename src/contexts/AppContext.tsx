import React, { createContext, useContext, useState, ReactNode } from "react";

<<<<<<< HEAD
export type UserRole = "superadmin" | "admin" | "cashier";
=======
export type UserRole = "owner" | "admin" | "cashier";
>>>>>>> e5ea5184f5aba375fa5cc9a7f3f39fa558a6b82c

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("admin");
  const [currentBusiness, setCurrentBusiness] = useState<Business>(DEMO_BUSINESSES[0]);
  const [currentBranch, setCurrentBranch] = useState<Branch>(DEMO_BUSINESSES[0].branches[0]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function buildActivationKey(businessId: string) {
    return `ACT-${businessId.split("-")[0].toUpperCase()}`;
  }

  function login(r: UserRole, business?: Business) {
    const resolvedBusiness = business ?? DEMO_BUSINESSES[0];
    setRole(r);
    setCurrentBusiness({
      ...resolvedBusiness,
      activationStatus: resolvedBusiness.activationStatus ?? "active",
      activationKey: resolvedBusiness.activationKey ?? buildActivationKey(resolvedBusiness.id),
    });
    setCurrentBranch(resolvedBusiness.branches[0] ?? { id: "main", name: "Main Branch", location: "N/A" });
    setIsLoggedIn(true);
  }

  function logout() {
    setIsLoggedIn(false);
  }

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
        isActivationPending: role !== "superadmin" && (currentBusiness.activationStatus ?? "active") !== "active",
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
