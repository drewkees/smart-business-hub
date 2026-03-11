import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import {
  deleteOrder,
  listOrderItems,
  listOrders,
  type OrderItemRow,
  type OrderRow,
  type OrderStatus,
} from "@/lib/orders";
import { Search, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | OrderStatus;

const DEMO_ORDERS: OrderRow[] = [
  {
    id: "1",
    order_number: "ORD-20260310-101001123",
    customer_name: "Walk-in",
    payment_method: "cash",
    status: "completed",
    subtotal: 540,
    discount_amount: 0,
    total_amount: 540,
    notes: null,
    created_at: new Date().toISOString(),
    item_count: 3,
  },
  {
    id: "2",
    order_number: "ORD-20260310-095932221",
    customer_name: "Maria Santos",
    payment_method: "card",
    status: "processing",
    subtotal: 1200,
    discount_amount: 100,
    total_amount: 1100,
    notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    item_count: 4,
  },
];

const STATUS_OPTIONS: StatusFilter[] = ["all", "pending", "processing", "completed", "refunded", "cancelled"];

const statusMap: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-warning-muted text-warning",
  completed: "bg-success-muted text-success",
  refunded: "bg-danger-muted text-danger",
  cancelled: "bg-muted text-muted-foreground",
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function money(v: number) {
  return `P ${Number(v || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Orders() {
  const { currentBusiness } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<OrderRow | null>(null);
  const [viewItems, setViewItems] = useState<OrderItemRow[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (active) setOrders(DEMO_ORDERS);
          return;
        }

        const rows = await listOrders(currentBusiness.id, search, statusFilter);
        if (active) setOrders(rows);
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? "Failed to load orders.");
          setOrders(DEMO_ORDERS);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentBusiness.id, search, statusFilter, refreshKey]);

  useEffect(() => {
    const t = window.setInterval(() => setRefreshKey((k) => k + 1), 5000);
    return () => window.clearInterval(t);
  }, []);

  const metrics = useMemo(() => {
    const totalAmount = orders.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
    const completed = orders.filter((o) => o.status === "completed").length;
    const processing = orders.filter((o) => o.status === "processing").length;
    const refunded = orders.filter((o) => o.status === "refunded").length;
    return {
      totalOrders: orders.length,
      totalAmount,
      completed,
      processing,
      refunded,
    };
  }, [orders]);

  async function onOpenView(order: OrderRow) {
    setViewOrder(order);
    setViewItems([]);
    setViewOpen(true);
    setViewLoading(true);
    try {
      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setViewItems([]);
        return;
      }
      const rows = await listOrderItems(order.id);
      setViewItems(rows);
    } catch {
      setViewItems([]);
    } finally {
      setViewLoading(false);
    }
  }

  async function onDeleteOrder(order: OrderRow) {
    const confirmed = window.confirm(`Delete order ${order.order_number}?`);
    if (!confirmed) return;

    try {
      setDeletingId(order.id);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setOrders((prev) => prev.filter((row) => row.id !== order.id));
        return;
      }

      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((row) => row.id !== order.id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete order.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout title="Orders">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Orders", value: String(metrics.totalOrders), sub: "Current results" },
            { label: "Sales", value: money(metrics.totalAmount), sub: "Total amount" },
            { label: "Completed", value: String(metrics.completed), sub: "Finished orders" },
            { label: "Processing", value: String(metrics.processing), sub: "In progress" },
            { label: "Refunded", value: String(metrics.refunded), sub: "Returned orders" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold font-display text-foreground mt-1">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
            <div className="flex-1 min-w-48 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Statuses" : option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="px-4 py-2 border-b border-border bg-warning-muted/40 text-warning text-xs">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Order #", "Customer", "Items", "Total", "Payment", "Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-border">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-7 w-16 rounded-lg" /></td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-primary">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{order.customer_name || "Walk-in"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{order.item_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{money(order.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground uppercase">{order.payment_method}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full capitalize", statusMap[order.status])}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenView(order)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order)}
                            disabled={deletingId === order.id}
                            className="p-1.5 rounded-lg hover:bg-danger-muted text-danger disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {viewOrder ? `${viewOrder.order_number} • ${viewOrder.customer_name || "Walk-in"}` : "Order details"}
            </DialogDescription>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-semibold uppercase">{viewOrder.payment_method}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full capitalize", statusMap[viewOrder.status])}>
                    {viewOrder.status}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] text-muted-foreground uppercase">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewLoading ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          Loading order items...
                        </td>
                      </tr>
                    ) : viewItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No item details available.
                        </td>
                      </tr>
                    ) : (
                      viewItems.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 text-sm">{item.item_name}</td>
                          <td className="px-3 py-2 text-sm">{item.quantity}</td>
                          <td className="px-3 py-2 text-sm">{money(item.unit_price)}</td>
                          <td className="px-3 py-2 text-sm font-semibold">{money(item.line_total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-right space-y-1">
                <div className="text-muted-foreground">Subtotal: {money(viewOrder.subtotal)}</div>
                <div className="text-muted-foreground">Discount: {money(viewOrder.discount_amount)}</div>
                <div className="font-semibold text-foreground">Total: {money(viewOrder.total_amount)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

