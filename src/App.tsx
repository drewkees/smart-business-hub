import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SystemDashboard from "./pages/SystemDashboard";
import BusinessManagement from "./pages/BusinessManagement";
import POSScreen from "./pages/POSScreen";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoggedIn, role, isActivationPending } = useApp();

  if (!isLoggedIn) return <Login />;

  if (role === "owner") {
    return (
      <Routes>
        <Route path="/" element={<SystemDashboard />} />
        <Route path="/businesses" element={<BusinessManagement />} />
        <Route path="/platform-users" element={<Customers />} />
        <Route path="/billing" element={<Settings />} />
        <Route path="/system-settings" element={<Settings />} />
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
      <Route path="/orders" element={<Orders />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/suppliers" element={<Inventory />} />
      <Route path="/staff" element={<Customers />} />
      <Route path="/branches" element={<Settings />} />
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
