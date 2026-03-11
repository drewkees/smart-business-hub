import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search, Filter, AlertTriangle, TrendingDown, Package, Plus, Download, Loader2, Save, Trash2, ImagePlus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  createInventoryItemWithInitialStock,
  deactivateInventoryItem,
  listInventoryItems,
  type InventoryItemRow,
  updateInventoryItem,
} from "@/lib/inventory";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listSuppliers } from "@/lib/suppliers";
import { listItemCategories } from "@/lib/itemCategories";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_ITEMS: InventoryItemRow[] = [
  { id: "1", name: "Premium Jasmine Rice 5kg", sku: "RICE-001", category: "Rice", quantity_in: 40, quantity_out: 38, current_stock: 2, reorder_level: 20, unit_price: 300, supplier: "Golden Farm" },
  { id: "2", name: "Paracetamol 500mg", sku: "MED-012", category: "Medicine", quantity_in: 120, quantity_out: 115, current_stock: 5, reorder_level: 50, unit_price: 8.5, supplier: "MedPharm" },
  { id: "3", name: "Cooking Oil 1L", sku: "GROC-041", category: "Grocery", quantity_in: 64, quantity_out: 50, current_stock: 14, reorder_level: 30, unit_price: 95, supplier: "FreshCo" },
  { id: "4", name: "Chicken Breast 1kg", sku: "MEAT-007", category: "Meat", quantity_in: 90, quantity_out: 48, current_stock: 42, reorder_level: 20, unit_price: 230, supplier: "Fresh Farms" },
  { id: "5", name: "Bottled Water 500ml", sku: "BEV-002", category: "Beverages", quantity_in: 200, quantity_out: 192, current_stock: 8, reorder_level: 30, unit_price: 30, supplier: "H2O Corp" },
];

type StatusKind = "critical" | "low" | "ok";
type ItemFilter = "all" | StatusKind;

const statusConfig: Record<StatusKind, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-danger-muted text-danger" },
  low: { label: "Low Stock", color: "bg-warning-muted text-warning" },
  ok: { label: "In Stock", color: "bg-success-muted text-success" },
};

function getStatus(item: InventoryItemRow): StatusKind {
  if (item.current_stock <= 0) return "critical";
  if (item.current_stock <= item.reorder_level) return "low";
  return "ok";
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type NewItemForm = {
  name: string;
  sku: string;
  category: string;
  supplier: string;
  unitPrice: string;
  reorderLevel: string;
  initialQuantity: string;
};

const DEFAULT_NEW_ITEM_FORM: NewItemForm = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  unitPrice: "0",
  reorderLevel: "0",
  initialQuantity: "0",
};

type EditItemForm = {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  unitPrice: string;
  reorderLevel: string;
  photoUrl?: string | null;
};

export default function Items() {
  const { currentBusiness, currentBranch } = useApp();
  const [search, setSearch] = useState("");
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all");
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewItemForm>(DEFAULT_NEW_ITEM_FORM);
  const [newItemPhotoName, setNewItemPhotoName] = useState<string>("");
  const [newItemPhotoPreview, setNewItemPhotoPreview] = useState<string | null>(null);
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<EditItemForm | null>(null);
  const [editItemPhotoName, setEditItemPhotoName] = useState<string>("");
  const [editItemPhotoPreview, setEditItemPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (active) setItems(DEMO_ITEMS);
          return;
        }

        const rows = await listInventoryItems(currentBusiness.id, search);
        if (active) setItems(rows);
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? "Failed to load inventory.");
          setItems(DEMO_ITEMS);
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

  useEffect(() => {
    let active = true;

    const loadSuppliers = async () => {
      try {
        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          const demoSuppliers = Array.from(new Set(DEMO_ITEMS.map((i) => i.supplier).filter((s): s is string => Boolean(s)))).sort((a, b) =>
            a.localeCompare(b),
          );
          if (active) setSupplierOptions(demoSuppliers);
          return;
        }

        const rows = await listSuppliers(currentBusiness.id);
        const names = rows
          .filter((s) => s.is_active && s.name?.trim())
          .map((s) => s.name.trim())
          .sort((a, b) => a.localeCompare(b));
        if (active) setSupplierOptions(Array.from(new Set(names)));
      } catch {
        if (active) setSupplierOptions([]);
      }
    };

    loadSuppliers();

    return () => {
      active = false;
    };
  }, [currentBusiness.id]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          const demoCategories = Array.from(new Set(DEMO_ITEMS.map((i) => i.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
          if (active) setCategoryOptions(demoCategories.length ? demoCategories : ["General"]);
          return;
        }

        const rows = await listItemCategories(currentBusiness.id);
        const names = rows
          .filter((c) => c.is_active && c.name?.trim())
          .map((c) => c.name.trim())
          .sort((a, b) => a.localeCompare(b));
        if (active) setCategoryOptions(Array.from(new Set(names.length ? names : ["General"])));
      } catch {
        if (active) setCategoryOptions(["General"]);
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, [currentBusiness.id]);

  const metrics = useMemo(() => {
    const total = items.length;
    const critical = items.filter((i) => getStatus(i) === "critical").length;
    const low = items.filter((i) => getStatus(i) === "low").length;
    const healthy = items.filter((i) => getStatus(i) === "ok").length;
    return { total, low, critical, healthy };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (itemFilter === "all") return items;
    return items.filter((i) => getStatus(i) === itemFilter);
  }, [items, itemFilter]);

  function resetAddForm() {
    setNewItem(DEFAULT_NEW_ITEM_FORM);
    setNewItemPhotoName("");
    setNewItemPhotoPreview(null);
    setAddError(null);
  }

  function onOpenAddItem() {
    resetAddForm();
    if (categoryOptions.length > 0) {
      setNewItem((p) => ({ ...p, category: categoryOptions[0] }));
    }
    setAddOpen(true);
  }

  async function onCreateItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const name = newItem.name.trim();
    const sku = newItem.sku.trim().toUpperCase();
    const category = newItem.category.trim() || "General";
    const supplier = newItem.supplier.trim();

    const unitPrice = Number(newItem.unitPrice);
    const reorderLevel = Number(newItem.reorderLevel);
    const initialQuantity = Number(newItem.initialQuantity);

    if (!name) {
      setAddError("Item name is required.");
      return;
    }
    if (!sku) {
      setAddError("SKU is required.");
      return;
    }
    if (!category) {
      setAddError("Category is required.");
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setAddError("Unit price must be 0 or higher.");
      return;
    }
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
      setAddError("Reorder level must be a whole number of 0 or higher.");
      return;
    }
    if (!Number.isInteger(initialQuantity) || initialQuantity < 0) {
      setAddError("Initial stock must be a whole number of 0 or higher.");
      return;
    }
    try {
      setAddLoading(true);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        const demoRow: InventoryItemRow = {
          id: `${Date.now()}`,
          name,
          sku,
          category,
          supplier: supplier || null,
          unit_price: unitPrice,
          reorder_level: reorderLevel,
          photo_url: newItemPhotoPreview,
          quantity_in: initialQuantity,
          quantity_out: 0,
          current_stock: initialQuantity,
        };
        setItems((prev) => [demoRow, ...prev]);
      } else {
        await createInventoryItemWithInitialStock({
          businessId: currentBusiness.id,
          branchId: isUuid(currentBranch.id) ? currentBranch.id : null,
          name,
          sku,
          category,
          supplier: supplier || null,
          unitPrice,
          reorderLevel,
          initialQuantity,
          initialStockNotes: "Initial stock on item creation",
          photoUrl: newItemPhotoPreview,
        });
        setRefreshKey((k) => k + 1);
      }

      setAddOpen(false);
      resetAddForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create item.";
      setAddError(message);
    } finally {
      setAddLoading(false);
    }
  }

  function onOpenEdit(item: InventoryItemRow) {
    setEditError(null);
    if (item.category && !categoryOptions.includes(item.category)) {
      setCategoryOptions((prev) => Array.from(new Set([item.category, ...prev])).sort((a, b) => a.localeCompare(b)));
    }
    if (item.supplier && !supplierOptions.includes(item.supplier)) {
      setSupplierOptions((prev) => Array.from(new Set([item.supplier as string, ...prev])).sort((a, b) => a.localeCompare(b)));
    }
    setEditItem({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category || (categoryOptions[0] ?? "General"),
      supplier: item.supplier ?? "",
      unitPrice: String(item.unit_price ?? 0),
      reorderLevel: String(item.reorder_level ?? 0),
      photoUrl: item.photo_url ?? "",
    });
    setEditItemPhotoName("");
    setEditItemPhotoPreview(item.photo_url ?? null);
    setEditOpen(true);
  }

  async function onSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;

    setEditError(null);
    const name = editItem.name.trim();
    const sku = editItem.sku.trim().toUpperCase();
    const category = editItem.category.trim();
    const supplier = editItem.supplier.trim();
    const unitPrice = Number(editItem.unitPrice);
    const reorderLevel = Number(editItem.reorderLevel);

    if (!name) return setEditError("Item name is required.");
    if (!sku) return setEditError("SKU is required.");
    if (!category) return setEditError("Category is required.");
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return setEditError("Unit price must be 0 or higher.");
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) return setEditError("Reorder level must be a whole number of 0 or higher.");

    try {
      setEditLoading(true);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setItems((prev) =>
          prev.map((row) =>
            row.id === editItem.id
              ? {
                  ...row,
                  name,
                  sku,
                  category,
                  supplier: supplier || null,
                  unit_price: unitPrice,
                  reorder_level: reorderLevel,
                }
              : row,
          ),
        );
      } else {
        await updateInventoryItem({
          businessId: currentBusiness.id,
          id: editItem.id,
          name,
          sku,
          category,
          supplier: supplier || null,
          unitPrice,
          reorderLevel,
          photoUrl: editItemPhotoPreview,
        });
        setRefreshKey((k) => k + 1);
      }

      setEditOpen(false);
      setEditItem(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update item.";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }

  async function onDeleteEditItem() {
    if (!editItem) return;
    if (!window.confirm("Delete this item? This will hide it from inventory.")) return;

    try {
      setEditLoading(true);
      setEditError(null);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setItems((prev) => prev.filter((row) => row.id !== editItem.id));
      } else {
        await deactivateInventoryItem(editItem.id);
        setRefreshKey((k) => k + 1);
      }

      setEditOpen(false);
      setEditItem(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete item.";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <AppLayout title="Items">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total SKUs", value: String(metrics.total), icon: Package, color: "from-blue-500 to-indigo-500" },
            { label: "Low Stock", value: String(metrics.low), icon: TrendingDown, color: "from-warning to-orange-400" },
            { label: "Critical", value: String(metrics.critical), icon: AlertTriangle, color: "from-danger to-rose-400" },
            { label: "Healthy", value: String(metrics.healthy), icon: Package, color: "from-success to-emerald-400" },
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
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <Select value={itemFilter} onValueChange={(value: ItemFilter) => setItemFilter(value)}>
              <SelectTrigger className="w-[170px] h-10 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="ok">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              type="button"
              onClick={onOpenAddItem}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {error && (
            <div className="px-4 py-2 border-b border-border bg-warning-muted/40 text-warning text-xs">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Product", "SKU", "Category", "Qty In", "Qty Out", "On Hand", "Reorder At", "Unit Price", "Supplier", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`item-skeleton-${i}`} className="border-b border-border">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-md" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">No items found.</td>
                  </tr>
                ) : (
                  filteredItems.map((item, i) => {
                    const status = getStatus(item);
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onDoubleClick={() => onOpenEdit(item)}
                        title="Double-click to edit"
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3"><p className="text-sm font-semibold text-foreground">{item.name}</p></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{item.sku}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">{item.category}</span></td>
                        <td className="px-4 py-3 text-sm font-semibold text-success">{item.quantity_in}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-danger">{item.quantity_out}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", status === "critical" ? "bg-danger" : status === "low" ? "bg-warning" : "bg-success")}
                                style={{ width: `${Math.min((item.current_stock / Math.max(item.reorder_level * 2, 1)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-foreground">{item.current_stock}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.reorder_level}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">P {item.unit_price}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.supplier || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", statusConfig[status].color)}>
                            {statusConfig[status].label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={onCreateItem} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Item</DialogTitle>
              <DialogDescription>Create a new item. Stock in/out is managed in Inventory movement.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="item-name">Item name</Label>
                <Input
                  id="item-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Premium Jasmine Rice 5kg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-sku">SKU</Label>
                <Input
                  id="item-sku"
                  value={newItem.sku}
                  onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="e.g. RICE-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem((p) => ({ ...p, category: value }))}>
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="item-supplier">Supplier</Label>
                <Select
                  value={newItem.supplier || "__none"}
                  onValueChange={(value) => setNewItem((p) => ({ ...p, supplier: value === "__none" ? "" : value }))}
                >
                  <SelectTrigger id="item-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No supplier</SelectItem>
                    {supplierOptions.map((supplierName) => (
                      <SelectItem key={supplierName} value={supplierName}>
                        {supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="item-photo">Photo</Label>
                <div className="rounded-xl border border-border p-3 bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="item-photo"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-primary bg-primary/10 text-sm font-medium cursor-pointer hover:bg-primary/15 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Upload Photo
                    </label>
                    <input
                      id="item-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setNewItemPhotoName(file?.name ?? "");
                        if (!file) {
                          setNewItemPhotoPreview(null);
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => setNewItemPhotoPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {newItemPhotoName || "No photo selected"}
                    </span>
                  </div>
                  {newItemPhotoPreview && (
                    <img src={newItemPhotoPreview} alt="Item preview" className="h-24 w-24 rounded-lg object-cover border border-border mt-3" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-price">Unit price</Label>
                <Input
                  id="item-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-reorder">Reorder level</Label>
                <Input
                  id="item-reorder"
                  type="number"
                  min={0}
                  step="1"
                  value={newItem.reorderLevel}
                  onChange={(e) => setNewItem((p) => ({ ...p, reorderLevel: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-initial-qty">Initial stock</Label>
                <Input
                  id="item-initial-qty"
                  type="number"
                  min={0}
                  step="1"
                  value={newItem.initialQuantity}
                  onChange={(e) => setNewItem((p) => ({ ...p, initialQuantity: e.target.value }))}
                />
              </div>

            </div>

            {addError && (
              <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{addError}</div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {addLoading ? "Saving..." : "Create Item"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={onSaveEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Update or delete this inventory item.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-item-name">Item name</Label>
                <Input
                  id="edit-item-name"
                  value={editItem?.name ?? ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, name: e.target.value } : p))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-sku">SKU</Label>
                <Input
                  id="edit-item-sku"
                  value={editItem?.sku ?? ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, sku: e.target.value } : p))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-category">Category</Label>
                <Select value={editItem?.category ?? ""} onValueChange={(value) => setEditItem((p) => (p ? { ...p, category: value } : p))}>
                  <SelectTrigger id="edit-item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-item-supplier">Supplier</Label>
                <Select
                  value={editItem?.supplier ? editItem.supplier : "__none"}
                  onValueChange={(value) => setEditItem((p) => (p ? { ...p, supplier: value === "__none" ? "" : value } : p))}
                >
                  <SelectTrigger id="edit-item-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No supplier</SelectItem>
                    {supplierOptions.map((supplierName) => (
                      <SelectItem key={supplierName} value={supplierName}>
                        {supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-price">Unit price</Label>
                <Input
                  id="edit-item-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editItem?.unitPrice ?? "0"}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, unitPrice: e.target.value } : p))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-reorder">Reorder level</Label>
                <Input
                  id="edit-item-reorder"
                  type="number"
                  min={0}
                  step="1"
                  value={editItem?.reorderLevel ?? "0"}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, reorderLevel: e.target.value } : p))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-item-photo">Photo</Label>
                <div className="rounded-xl border border-border p-3 bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="edit-item-photo"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-primary bg-primary/10 text-sm font-medium cursor-pointer hover:bg-primary/15 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Replace Photo
                    </label>
                    <input
                      id="edit-item-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setEditItemPhotoName(file?.name ?? "");
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setEditItemPhotoPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {editItemPhotoName || "Keep existing photo"}
                    </span>
                  </div>
                  {editItemPhotoPreview && (
                    <img src={editItemPhotoPreview} alt="Item preview" className="h-24 w-24 rounded-lg object-cover border border-border mt-3" />
                  )}
                </div>
              </div>
            </div>

            {editError && (
              <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{editError}</div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={onDeleteEditItem}
                disabled={editLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm hover:bg-danger-muted/40 transition-colors disabled:opacity-70"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
