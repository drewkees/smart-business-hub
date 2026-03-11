import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { createSupplier, listSuppliers, type SupplierRow } from "@/lib/suppliers";
import { Search, Filter, Download, Plus, Handshake, Mail, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEMO_SUPPLIERS: SupplierRow[] = [
  { id: "1", name: "Golden Farm", contact_person: "Mark Santos", email: "sales@goldenfarm.ph", phone: "+63 917 123 4567", address: "Bulacan", notes: null, is_active: true },
  { id: "2", name: "MedPharm", contact_person: "Ana Cruz", email: "orders@medpharm.com", phone: "+63 918 345 6789", address: "Makati", notes: null, is_active: true },
  { id: "3", name: "FreshCo", contact_person: "Jose Reyes", email: "support@freshco.ph", phone: "+63 919 555 1234", address: "Quezon City", notes: null, is_active: true },
  { id: "4", name: "H2O Corp", contact_person: "Liza Tan", email: "hello@h2ocorp.ph", phone: "+63 920 888 9900", address: "Pasig", notes: null, is_active: true },
];

type NewSupplierForm = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const DEFAULT_NEW_SUPPLIER: NewSupplierForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};
type SupplierFilter = "all" | "active" | "inactive";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function Suppliers() {
  const { currentBusiness } = useApp();
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>("all");
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>(DEFAULT_NEW_SUPPLIER);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (active) setSuppliers(DEMO_SUPPLIERS);
          return;
        }

        const rows = await listSuppliers(currentBusiness.id, search);
        if (active) setSuppliers(rows);
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? "Failed to load suppliers.");
          setSuppliers(DEMO_SUPPLIERS);
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
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.is_active).length;
    const withEmail = suppliers.filter((s) => Boolean(s.email)).length;
    const withPhone = suppliers.filter((s) => Boolean(s.phone)).length;
    return { total, active, withEmail, withPhone };
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (supplierFilter === "all") return suppliers;
    if (supplierFilter === "active") return suppliers.filter((s) => s.is_active);
    return suppliers.filter((s) => !s.is_active);
  }, [suppliers, supplierFilter]);

  function resetCreateForm() {
    setNewSupplier(DEFAULT_NEW_SUPPLIER);
    setAddError(null);
  }

  function onOpenCreate() {
    resetCreateForm();
    setAddOpen(true);
  }

  async function onCreateSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const name = newSupplier.name.trim();
    if (!name) {
      setAddError("Supplier name is required.");
      return;
    }

    const email = newSupplier.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddError("Enter a valid email address.");
      return;
    }

    try {
      setAddLoading(true);

      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        const row: SupplierRow = {
          id: `${Date.now()}`,
          name,
          contact_person: newSupplier.contactPerson.trim() || null,
          email: email || null,
          phone: newSupplier.phone.trim() || null,
          address: newSupplier.address.trim() || null,
          notes: newSupplier.notes.trim() || null,
          is_active: true,
        };
        setSuppliers((prev) => [row, ...prev]);
      } else {
        await createSupplier({
          businessId: currentBusiness.id,
          name,
          contactPerson: newSupplier.contactPerson,
          email,
          phone: newSupplier.phone,
          address: newSupplier.address,
          notes: newSupplier.notes,
        });
        setRefreshKey((k) => k + 1);
      }

      setAddOpen(false);
      resetCreateForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create supplier.";
      setAddError(message);
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <AppLayout title="Suppliers">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Suppliers", value: String(metrics.total), icon: Handshake, color: "from-blue-500 to-indigo-500" },
            { label: "Active", value: String(metrics.active), icon: Handshake, color: "from-success to-emerald-400" },
            { label: "With Email", value: String(metrics.withEmail), icon: Mail, color: "from-warning to-orange-400" },
            { label: "With Phone", value: String(metrics.withPhone), icon: Phone, color: "from-cyan-500 to-sky-500" },
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
                placeholder="Search suppliers..."
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <Select value={supplierFilter} onValueChange={(v: SupplierFilter) => setSupplierFilter(v)}>
              <SelectTrigger className="w-[170px] h-10 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
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
              <Plus className="w-4 h-4" /> Add Supplier
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
                  {["Supplier", "Contact Person", "Email", "Phone", "Address", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`supplier-skeleton-${i}`} className="border-b border-border">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No suppliers found.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier, i) => (
                    <motion.tr
                      key={supplier.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{supplier.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{supplier.contact_person || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{supplier.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{supplier.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{supplier.address || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-1 rounded-full",
                            supplier.is_active ? "bg-success-muted text-success" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {supplier.is_active ? "Active" : "Inactive"}
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
          <form onSubmit={onCreateSupplier} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
              <DialogDescription>Create a supplier for this business.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-name">Supplier name</Label>
                <Input
                  id="supplier-name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Golden Farm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-contact">Contact person</Label>
                <Input
                  id="supplier-contact"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier((p) => ({ ...p, contactPerson: e.target.value }))}
                  placeholder="e.g. Mark Santos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-phone">Phone</Label>
                <Input
                  id="supplier-phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. +63 917 123 4567"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-email">Email</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. sales@supplier.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-address">Address</Label>
                <Input
                  id="supplier-address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. Bulacan"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-notes">Notes</Label>
                <Textarea
                  id="supplier-notes"
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={3}
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
                {addLoading ? "Saving..." : "Create Supplier"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
