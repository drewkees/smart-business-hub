import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import BusinessManagement from "@/pages/BusinessManagement";
import Branches from "@/pages/Branches";
import Customers from "@/pages/Customers";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import ItemCategories from "@/pages/ItemCategories";
import Items from "@/pages/Items";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Orders from "@/pages/Orders";
import POSScreen from "@/pages/POSScreen";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import StaffRoles from "@/pages/StaffRoles";
import Suppliers from "@/pages/Suppliers";
import SuperAdmin from "@/pages/SuperAdmin";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoggedIn, role, isActivationPending, isAuthReady } = useApp();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mx-auto h-12 w-3/4" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <Login />;

  if (role === "superadmin") {
    return (
      <Routes>
        <Route path="/" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (isActivationPending) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={role === "cashier" ? <Navigate to="/pos" replace /> : <Dashboard />} />
      <Route path="/pos" element={<POSScreen />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/items" element={<Items />} />
      <Route path="/item-categories" element={<ItemCategories />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/staff" element={<StaffRoles />} />
      <Route path="/branches" element={<Branches />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
