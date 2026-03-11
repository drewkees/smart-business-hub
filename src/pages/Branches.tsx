import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
  type BranchRow,
} from "@/lib/branches";
import { Search, Plus, Building2, MapPin, Star, Loader2, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type BranchForm = {
  name: string;
  location: string;
  isMain: boolean;
};

const DEFAULT_FORM: BranchForm = {
  name: "",
  location: "",
  isMain: false,
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function Branches() {
  const { currentBusiness } = useApp();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<BranchForm>(DEFAULT_FORM);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BranchForm>(DEFAULT_FORM);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          const demo: BranchRow[] = currentBusiness.branches.map((b, idx) => ({
            id: b.id,
            business_id: currentBusiness.id,
            name: b.name,
            location: b.location,
            is_main: idx === 0,
            created_at: new Date().toISOString(),
          }));
          if (!active) return;
          const q = search.trim().toLowerCase();
          setRows(q ? demo.filter((r) => r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)) : demo);
          return;
        }

        const data = await listBranches(currentBusiness.id, search);
        if (active) setRows(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load branches.");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentBusiness.id, currentBusiness.branches, search, refreshKey]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const main = rows.filter((r) => r.is_main).length;
    const secondary = total - main;
    return { total, main, secondary };
  }, [rows]);

  function openAdd() {
    setAddError(null);
    setAddForm({ ...DEFAULT_FORM, isMain: rows.length === 0 });
    setAddOpen(true);
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const name = addForm.name.trim();
    const location = addForm.location.trim();
    if (!name) return setAddError("Branch name is required.");
    if (!location) return setAddError("Branch location is required.");

    try {
      setAddLoading(true);
      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        const row: BranchRow = {
          id: String(Date.now()),
          business_id: currentBusiness.id,
          name,
          location,
          is_main: addForm.isMain,
          created_at: new Date().toISOString(),
        };
        setRows((prev) => {
          const next = addForm.isMain ? prev.map((p) => ({ ...p, is_main: false })) : prev;
          return [row, ...next];
        });
      } else {
        await createBranch({
          businessId: currentBusiness.id,
          name,
          location,
          isMain: addForm.isMain,
        });
        setRefreshKey((k) => k + 1);
      }
      setAddOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create branch.";
      setAddError(message);
    } finally {
      setAddLoading(false);
    }
  }

  function openEdit(row: BranchRow) {
    setEditing(row);
    setEditError(null);
    setEditForm({
      name: row.name,
      location: row.location,
      isMain: row.is_main,
    });
    setEditOpen(true);
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;

    setEditError(null);
    const name = editForm.name.trim();
    const location = editForm.location.trim();
    if (!name) return setEditError("Branch name is required.");
    if (!location) return setEditError("Branch location is required.");

    try {
      setEditLoading(true);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setRows((prev) =>
          prev
            .map((r) => {
              if (editForm.isMain && r.id !== editing.id) return { ...r, is_main: false };
              if (r.id !== editing.id) return r;
              return { ...r, name, location, is_main: editForm.isMain };
            }),
        );
      } else {
        await updateBranch({
          id: editing.id,
          businessId: currentBusiness.id,
          name,
          location,
          isMain: editForm.isMain,
        });
        setRefreshKey((k) => k + 1);
      }

      setEditOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update branch.";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }

  async function onDelete(row: BranchRow) {
    const ok = window.confirm(`Delete branch "${row.name}"?`);
    if (!ok) return;

    try {
      setDeletingId(row.id);
      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } else {
        await deleteBranch(row.id);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete branch.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout title="Branches">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Branches", value: String(metrics.total), icon: Building2, color: "from-blue-600 to-blue-500" },
            { label: "Main Branches", value: String(metrics.main), icon: Star, color: "from-emerald-600 to-emerald-500" },
            { label: "Secondary Branches", value: String(metrics.secondary), icon: MapPin, color: "from-slate-700 to-slate-600" },
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
                placeholder="Search branches..."
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </div>

          {error && (
            <div className="px-4 py-2 border-b border-border bg-danger-muted/40 text-danger text-xs">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Branch", "Location", "Type", "Created", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`branch-skeleton-${i}`} className="border-b border-border">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-52" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-7 w-16 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No branches found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.location}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", row.is_main ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground")}>
                          {row.is_main ? "Main" : "Secondary"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                            title="Edit branch"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            disabled={deletingId === row.id}
                            className="p-1.5 rounded-lg hover:bg-danger-muted text-danger disabled:opacity-50"
                            title="Delete branch"
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={onCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Branch</DialogTitle>
              <DialogDescription>Create a new branch for this business.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch name</Label>
              <Input
                id="branch-name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Main Branch"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-location">Location</Label>
              <Input
                id="branch-location"
                value={addForm.location}
                onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. BGC, Taguig"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={addForm.isMain}
                onChange={(e) => setAddForm((p) => ({ ...p, isMain: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              Set as main branch
            </label>

            {addError && <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{addError}</div>}

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
                {addLoading ? "Saving..." : "Create Branch"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={onUpdate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
              <DialogDescription>Update branch details.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="edit-branch-name">Branch name</Label>
              <Input
                id="edit-branch-name"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-branch-location">Location</Label>
              <Input
                id="edit-branch-location"
                value={editForm.location}
                onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={editForm.isMain}
                onChange={(e) => setEditForm((p) => ({ ...p, isMain: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              Set as main branch
            </label>

            {editError && <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{editError}</div>}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
