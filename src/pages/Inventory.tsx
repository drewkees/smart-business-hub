import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Search, Filter, Download, Plus, Loader2, ArrowDownCircle, ArrowUpCircle, Activity } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { createStockMovement, listInventoryItems, listStockMovements, type InventoryItemRow, type StockMovementRow } from "@/lib/inventory";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
type MovementFilter = "all" | "in" | "out";

const DEMO_MOVEMENTS: StockMovementRow[] = [
  { id: "1", created_at: new Date().toISOString(), movement_type: "in", quantity: 20, reference_type: "purchase", reference_id: "PO-1001", notes: "Supplier delivery", item_id: "1", item_name: "Premium Jasmine Rice 5kg", item_sku: "RICE-001", created_by: null },
  { id: "2", created_at: new Date().toISOString(), movement_type: "out", quantity: 5, reference_type: "sale", reference_id: "INV-2001", notes: "POS sales", item_id: "1", item_name: "Premium Jasmine Rice 5kg", item_sku: "RICE-001", created_by: null },
];

type NewMovementForm = {
  itemId: string;
  movementType: "in" | "out";
  quantity: string;
  notes: string;
};

const DEFAULT_MOVEMENT_FORM: NewMovementForm = {
  itemId: "",
  movementType: "in",
  quantity: "1",
  notes: "",
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function fmtDate(v: string) {
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}

export default function Inventory() {
  const { currentBusiness, currentBranch } = useApp();
  const [search, setSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("all");
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newMovement, setNewMovement] = useState<NewMovementForm>(DEFAULT_MOVEMENT_FORM);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (active) {
            setMovements(DEMO_MOVEMENTS);
            setItems([
              { id: "1", name: "Premium Jasmine Rice 5kg", sku: "RICE-001", category: "Rice", supplier: "Golden Farm", unit_price: 300, reorder_level: 20, quantity_in: 40, quantity_out: 20, current_stock: 20 },
            ]);
          }
          return;
        }

        const [movementRows, itemRows] = await Promise.all([
          listStockMovements(currentBusiness.id, search),
          listInventoryItems(currentBusiness.id),
        ]);
        if (!active) return;
        setMovements(movementRows);
        setItems(itemRows);
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? "Failed to load inventory movement.");
          setMovements(DEMO_MOVEMENTS);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentBusiness.id, search, refreshKey]);

  const metrics = useMemo(() => {
    const total = movements.length;
    const inCount = movements.filter((m) => m.movement_type === "in").length;
    const outCount = movements.filter((m) => m.movement_type === "out").length;
    return { total, inCount, outCount };
  }, [movements]);

  const filteredMovements = useMemo(() => {
    if (movementFilter === "all") return movements;
    return movements.filter((m) => m.movement_type === movementFilter);
  }, [movements, movementFilter]);

  function openAddMovement() {
    setAddError(null);
    setNewMovement({
      ...DEFAULT_MOVEMENT_FORM,
      itemId: items[0]?.id ?? "",
    });
    setAddOpen(true);
  }

  async function onCreateMovement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    const quantity = Number(newMovement.quantity);
    if (!newMovement.itemId) return setAddError("Select an item.");
    if (!Number.isInteger(quantity) || quantity <= 0) return setAddError("Quantity must be a whole number greater than 0.");

    try {
      setAddLoading(true);
      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        const item = items.find((i) => i.id === newMovement.itemId);
        const row: StockMovementRow = {
          id: `${Date.now()}`,
          created_at: new Date().toISOString(),
          movement_type: newMovement.movementType,
          quantity,
          reference_type: null,
          reference_id: null,
          notes: newMovement.notes || null,
          item_id: newMovement.itemId,
          item_name: item?.name ?? "-",
          item_sku: item?.sku ?? "-",
          created_by: null,
        };
        setMovements((prev) => [row, ...prev]);
      } else {
        await createStockMovement({
          businessId: currentBusiness.id,
          branchId: isUuid(currentBranch.id) ? currentBranch.id : null,
          itemId: newMovement.itemId,
          movementType: newMovement.movementType,
          quantity,
          notes: newMovement.notes || null,
        });
        setRefreshKey((k) => k + 1);
      }
      setAddOpen(false);
    } catch (err: any) {
      setAddError(err?.message ?? "Failed to create movement.");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <AppLayout title="Inventory Movement">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Movements", value: String(metrics.total), icon: Activity, color: "from-blue-500 to-indigo-500" },
            { label: "Stock In", value: String(metrics.inCount), icon: ArrowDownCircle, color: "from-success to-emerald-400" },
            { label: "Stock Out", value: String(metrics.outCount), icon: ArrowUpCircle, color: "from-warning to-orange-400" },
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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movement..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
            <Select value={movementFilter} onValueChange={(v: MovementFilter) => setMovementFilter(v)}>
              <SelectTrigger className="w-[170px] h-10 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Movements</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button type="button" onClick={openAddMovement} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary">
              <Plus className="w-4 h-4" /> Add Movement
            </button>
          </div>

          {error && <div className="px-4 py-2 border-b border-border bg-warning-muted/40 text-warning text-xs">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Item", "Type", "Qty", "Reference", "Notes"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`movement-skeleton-${i}`} className="border-b border-border">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                    </tr>
                  ))
                ) : filteredMovements.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No movement found.</td></tr>
                ) : (
                  filteredMovements.map((m, i) => (
                    <motion.tr key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{m.item_name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{m.item_sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", m.movement_type === "in" ? "bg-success-muted text-success" : "bg-warning-muted text-warning")}>
                          {m.movement_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{m.quantity}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{[m.reference_type, m.reference_id].filter(Boolean).join(": ") || "-"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{m.notes || "-"}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={onCreateMovement} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Stock Movement</DialogTitle>
              <DialogDescription>Record stock in/out for an existing item.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Item</Label>
                <Select value={newMovement.itemId} onValueChange={(v) => setNewMovement((p) => ({ ...p, itemId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {items.map((it) => (
                      <SelectItem key={it.id} value={it.id}>{it.name} ({it.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Movement type</Label>
                <Select value={newMovement.movementType} onValueChange={(v: "in" | "out") => setNewMovement((p) => ({ ...p, movementType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="out">out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="move-qty">Quantity</Label>
                <Input id="move-qty" type="number" min={1} step="1" value={newMovement.quantity} onChange={(e) => setNewMovement((p) => ({ ...p, quantity: e.target.value }))} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="move-notes">Notes</Label>
                <Input id="move-notes" value={newMovement.notes} onChange={(e) => setNewMovement((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>

            {addError && <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{addError}</div>}

            <DialogFooter>
              <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={addLoading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70">
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {addLoading ? "Saving..." : "Create Movement"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
