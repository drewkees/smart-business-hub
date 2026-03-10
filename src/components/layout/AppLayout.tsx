import { useApp } from "@/contexts/AppContext";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { currentBusiness, isActivationPending } = useApp();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader title={title} />
        {isActivationPending && (
          <div className="mx-4 mt-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-900 md:mx-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4" />
              <span className="font-semibold">Business activation pending</span>
              <span className="text-amber-800/90">Activation Key:</span>
              <code className="rounded bg-amber-100 px-2 py-0.5 font-semibold">{currentBusiness.activationKey ?? "N/A"}</code>
            </div>
            <p className="mt-1 text-xs text-amber-800/90">Only Dashboard is available until your business is activated.</p>
          </div>
        )}
        <motion.main
          key={title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
