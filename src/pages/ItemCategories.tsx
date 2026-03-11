import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { createItemCategory, listItemCategories, type ItemCategoryRow } from "@/lib/itemCategories";
import { Search, Filter, Download, Plus, Shapes, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEMO_CATEGORIES: ItemCategoryRow[] = [
  { id: "1", name: "Rice", description: "Grains and rice products", is_active: true },
  { id: "2", name: "Grocery", description: "Daily grocery items", is_active: true },
  { id: "3", name: "Meat", description: "Fresh and frozen meat", is_active: true },
  { id: "4", name: "Beverages", description: "Drinks and water", is_active: true },
  { id: "5", name: "Medicine", description: "OTC and pharmacy items", is_active: true },
];

type NewCategoryForm = {
  name: string;
  description: string;
};

const DEFAULT_NEW_CATEGORY: NewCategoryForm = {
  name: "",
  description: "",
};
type CategoryFilter = "all" | "active" | "inactive";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function ItemCategories() {
  const { currentBusiness } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [categories, setCategories] = useState<ItemCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<NewCategoryForm>(DEFAULT_NEW_CATEGORY);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (active) setCategories(DEMO_CATEGORIES);
          return;
        }

        const rows = await listItemCategories(currentBusiness.id, search);
        if (active) setCategories(rows);
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? "Failed to load item categories.");
          setCategories(DEMO_CATEGORIES);
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
    const total = categories.length;
    const active = categories.filter((c) => c.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (categoryFilter === "all") return categories;
    if (categoryFilter === "active") return categories.filter((c) => c.is_active);
    return categories.filter((c) => !c.is_active);
  }, [categories, categoryFilter]);

  function resetCreateForm() {
    setNewCategory(DEFAULT_NEW_CATEGORY);
    setAddError(null);
  }

  function onOpenCreate() {
    resetCreateForm();
    setAddOpen(true);
  }

  async function onCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const name = newCategory.name.trim();
    if (!name) {
      setAddError("Category name is required.");
      return;
    }

    try {
      setAddLoading(true);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        const row: ItemCategoryRow = {
          id: `${Date.now()}`,
          name,
          description: newCategory.description.trim() || null,
          is_active: true,
        };
        setCategories((prev) => [row, ...prev]);
      } else {
        await createItemCategory({
          businessId: currentBusiness.id,
          name,
          description: newCategory.description,
        });
        setRefreshKey((k) => k + 1);
      }

      setAddOpen(false);
      resetCreateForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create category.";
      setAddError(message);
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <AppLayout title="Item Categories">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Categories", value: String(metrics.total), icon: Shapes, color: "from-blue-500 to-indigo-500" },
            { label: "Active", value: String(metrics.active), icon: Shapes, color: "from-success to-emerald-400" },
            { label: "Inactive", value: String(metrics.inactive), icon: Shapes, color: "from-warning to-orange-400" },
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
                placeholder="Search categories..."
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v: CategoryFilter) => setCategoryFilter(v)}>
              <SelectTrigger className="w-[170px] h-10 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary"
            >
              <Plus className="w-4 h-4" /> Add Category
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
                  {["Category", "Description", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`category-skeleton-${i}`} className="border-b border-border">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-64" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No categories found.</td>
                  </tr>
                ) : (
                  filteredCategories.map((category, i) => (
                    <motion.tr
                      key={category.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{category.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{category.description || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-1 rounded-full",
                            category.is_active ? "bg-success-muted text-success" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
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
          <form onSubmit={onCreateCategory} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Item Category</DialogTitle>
              <DialogDescription>Create a category to use in item creation.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category name</Label>
                <Input
                  id="category-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Beverages"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  rows={3}
                  value={newCategory.description}
                  onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description..."
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
                {addLoading ? "Saving..." : "Create Category"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
