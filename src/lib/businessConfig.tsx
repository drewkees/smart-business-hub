import { BusinessType } from "@/contexts/AppContext";
import {
  Utensils, Package, ShoppingCart, ShoppingBag, Pill, Wrench, Scissors
} from "lucide-react";

export const BUSINESS_TYPE_CONFIG: Record<
  BusinessType,
  {
    label: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    gradient: string;
    description: string;
  }
> = {
  restaurant: {
    label: "Restaurant",
    icon: Utensils,
    color: "text-orange-500",
    gradient: "from-orange-500 to-amber-400",
    description: "Table orders, kitchen tickets, menu management",
  },
  rice: {
    label: "Rice Business",
    icon: Package,
    color: "text-yellow-600",
    gradient: "from-yellow-500 to-amber-400",
    description: "Sack/weight-based selling, bulk & wholesale",
  },
  retail: {
    label: "Retail Store",
    icon: ShoppingCart,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-400",
    description: "Barcode scanning, categories, stock tracking",
  },
  grocery: {
    label: "Grocery",
    icon: ShoppingBag,
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-400",
    description: "Fresh items, expiry tracking, promos",
  },
  pharmacy: {
    label: "Pharmacy",
    icon: Pill,
    color: "text-teal-500",
    gradient: "from-teal-500 to-cyan-400",
    description: "Medicine lookup, expiry alerts, batch tracking",
  },
  hardware: {
    label: "Hardware",
    icon: Wrench,
    color: "text-slate-500",
    gradient: "from-slate-500 to-zinc-400",
    description: "Parts catalog, unit conversions, supplier POs",
  },
  salon: {
    label: "Salon & Services",
    icon: Scissors,
    color: "text-pink-500",
    gradient: "from-pink-500 to-rose-400",
    description: "Appointments, service packages, staff assignment",
  },
};
