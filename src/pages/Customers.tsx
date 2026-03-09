import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Plus, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

const customers = [
  { name: "Maria Santos", email: "maria@email.com", phone: "09171234567", orders: 24, spent: 38400 },
  { name: "Jose Reyes", email: "jose@email.com", phone: "09181234567", orders: 18, spent: 29700 },
  { name: "Ana Cruz", email: "ana@email.com", phone: "09191234567", orders: 31, spent: 52800 },
  { name: "Mark Lopez", email: "mark@email.com", phone: "09201234567", orders: 9, spent: 14200 },
  { name: "Lisa Tan", email: "lisa@email.com", phone: "09211234567", orders: 45, spent: 71600 },
];

export default function Customers() {
  return (
    <AppLayout title="Customers">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[{ label: "Total Customers", value: "1,284" }, { label: "Active (30d)", value: "342" }, { label: "Avg. Lifetime Value", value: "₱ 8,420" }].map(({ label, value }) => (
            <div key={label} className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold font-display text-foreground mt-1">{value}</p>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input placeholder="Search customers..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Customer", "Contact", "Orders", "Total Spent", "Tier"].map(h => (
                  <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <motion.tr key={c.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.name[0]}</div>
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{c.orders}</td>
                  <td className="px-4 py-3 text-sm font-bold text-primary">₱ {c.spent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.spent > 50000 ? "bg-warning-muted text-warning" : c.spent > 20000 ? "bg-primary-muted text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {c.spent > 50000 ? "⭐ Gold" : c.spent > 20000 ? "Silver" : "Regular"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
