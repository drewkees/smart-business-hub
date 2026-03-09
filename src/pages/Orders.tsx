import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Filter, Eye, Download } from "lucide-react";

const orders = [
  { id: "#1042", customer: "Maria Santos", items: 3, total: 1250, method: "Cash", status: "completed", date: "Today 2:14 PM" },
  { id: "#1041", customer: "Jose Reyes", items: 7, total: 3420, method: "Card", status: "processing", date: "Today 2:08 PM" },
  { id: "#1040", customer: "Ana Cruz", items: 2, total: 680, method: "QR Pay", status: "completed", date: "Today 1:55 PM" },
  { id: "#1039", customer: "Walk-in", items: 5, total: 2150, method: "Cash", status: "completed", date: "Today 1:42 PM" },
  { id: "#1038", customer: "Mark Lopez", items: 1, total: 450, method: "Cash", status: "refunded", date: "Today 1:30 PM" },
  { id: "#1037", customer: "Lisa Tan", items: 4, total: 1890, method: "Card", status: "completed", date: "Today 1:10 PM" },
  { id: "#1036", customer: "Robert Ng", items: 6, total: 2740, method: "Cash", status: "completed", date: "Today 12:55 PM" },
];

const statusMap: Record<string, string> = {
  completed: "bg-success-muted text-success",
  processing: "bg-warning-muted text-warning",
  refunded: "bg-danger-muted text-danger",
};

export default function Orders() {
  return (
    <AppLayout title="Orders & Transactions">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Today", value: "₱ 37,840", sub: "121 orders" },
            { label: "Completed", value: "114", sub: "94.2% success rate" },
            { label: "Processing", value: "5", sub: "Awaiting action" },
            { label: "Refunded", value: "2", sub: "₱ 900 returned" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold font-display text-foreground mt-1">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input placeholder="Search orders..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Order ID", "Customer", "Items", "Total", "Method", "Date", "Status", ""].map(h => (
                  <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-primary">{o.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{o.customer}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{o.items}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">₱ {o.total.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">{o.method}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{o.date}</td>
                  <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full capitalize", statusMap[o.status])}>{o.status}</span></td>
                  <td className="px-4 py-3"><button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Eye className="w-3.5 h-3.5" /></button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
