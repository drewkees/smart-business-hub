import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search, Filter, AlertTriangle, TrendingDown, Package, Plus, Download } from "lucide-react";

const items = [
  { name: "Premium Jasmine Rice 5kg", sku: "RICE-001", category: "Rice", stock: 2, reorder: 20, price: 300, supplier: "Golden Farm", status: "critical" },
  { name: "Paracetamol 500mg", sku: "MED-012", category: "Medicine", stock: 5, reorder: 50, price: 8.50, supplier: "MedPharm", status: "low" },
  { name: "Cooking Oil 1L", sku: "GROC-041", category: "Grocery", stock: 14, reorder: 30, price: 95, supplier: "FreshCo", status: "low" },
  { name: "Chicken Breast 1kg", sku: "MEAT-007", category: "Meat", stock: 42, reorder: 20, price: 230, supplier: "Fresh Farms", status: "ok" },
  { name: "Bottled Water 500ml", sku: "BEV-002", category: "Beverages", stock: 8, reorder: 30, price: 30, supplier: "H2O Corp", status: "low" },
  { name: "White Sugar 1kg", sku: "GROC-019", category: "Grocery", stock: 55, reorder: 25, price: 70, supplier: "SweetCo", status: "ok" },
  { name: "Pork Belly 1kg", sku: "MEAT-012", category: "Meat", stock: 28, reorder: 15, price: 320, supplier: "Fresh Farms", status: "ok" },
  { name: "Mineral Water 1.5L", sku: "BEV-008", category: "Beverages", stock: 60, reorder: 40, price: 45, supplier: "H2O Corp", status: "ok" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-danger-muted text-danger" },
  low: { label: "Low Stock", color: "bg-warning-muted text-warning" },
  ok: { label: "In Stock", color: "bg-success-muted text-success" },
};

export default function Inventory() {
  return (
    <AppLayout title="Inventory">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total SKUs", value: "482", icon: Package, color: "from-blue-500 to-indigo-500" },
            { label: "Low Stock", value: "14", icon: TrendingDown, color: "from-warning to-orange-400" },
            { label: "Critical", value: "3", icon: AlertTriangle, color: "from-danger to-rose-400" },
            { label: "Healthy", value: "465", icon: Package, color: "from-success to-emerald-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input placeholder="Search inventory..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Product", "SKU", "Category", "Stock", "Reorder At", "Unit Price", "Supplier", "Status"].map(h => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <motion.tr key={item.sku} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{item.sku}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">{item.category}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", item.status === "critical" ? "bg-danger" : item.status === "low" ? "bg-warning" : "bg-success")}
                            style={{ width: `${Math.min((item.stock / (item.reorder * 2)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{item.stock}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.reorder}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">₱ {item.price}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.supplier}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", statusConfig[item.status].color)}>
                        {statusConfig[item.status].label}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
