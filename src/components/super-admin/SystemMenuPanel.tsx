import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as LucideIcons from "lucide-react";
import { FileCode, LayoutGrid, Pencil, Plus, Search, Settings, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { createSchema, deleteSchema, listSchemas, type SaveSchemaInput, type SchemaMenuType, type SchemaRow, updateSchema } from "@/lib/systemMenu";
import { cn } from "@/lib/utils";

const MENU_TYPE_META: Record<SchemaMenuType, { label: string; icon: any; badgeClass: string }> = {
  M: { label: "Menu", icon: LayoutGrid, badgeClass: "border border-blue-500/30 bg-blue-500/15 text-blue-200" },
  S: { label: "Submenu", icon: LucideIcons.FolderOpen, badgeClass: "border border-amber-500/30 bg-amber-500/15 text-amber-200" },
  P: { label: "Program", icon: FileCode, badgeClass: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200" },
};

const ALL_LUCIDE_ICONS = Object.keys(LucideIcons).filter((key) => /^[A-Z]/.test(key) && key !== "createLucideIcon");

function SchemaTypeBadge({ type }: { type: SchemaMenuType }) {
  const meta = MENU_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", meta.badgeClass)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function SystemMenuPanel() {
  const [rows, setRows] = useState<SchemaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<SchemaRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const [form, setForm] = useState<SaveSchemaInput>({
    menuid: "",
    menuname: "",
    menucmd: "",
    objectcode: "",
    menutype: "M",
    menuicon: "",
    udfmaintained: false,
  });

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listSchemas(search);
        if (active) setRows(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load system menu.");
      } finally {
        if (active) setLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  const counts = useMemo(
    () => ({
      M: rows.filter((row) => row.menutype === "M").length,
      S: rows.filter((row) => row.menutype === "S").length,
      P: rows.filter((row) => row.menutype === "P").length,
    }),
    [rows]
  );

  function resetForm() {
    setEditingRow(null);
    setForm({
      menuid: "",
      menuname: "",
      menucmd: "",
      objectcode: "",
      menutype: "M",
      menuicon: "",
      udfmaintained: false,
    });
    setIconSearch("");
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(row: SchemaRow) {
    setEditingRow(row);
    setForm({
      menuid: row.menuid,
      menuname: row.menuname,
      menucmd: row.menucmd ?? "",
      objectcode: row.objectcode ?? "",
      menutype: row.menutype,
      menuicon: row.menuicon ?? "",
      udfmaintained: row.udfmaintained,
    });
    setIconSearch("");
    setShowModal(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      const payload: SaveSchemaInput = {
        ...form,
        menuid: form.menuid.trim(),
        menuname: form.menuname.trim(),
        menucmd: form.menucmd?.trim() || null,
        objectcode: form.objectcode?.trim() || null,
        menuicon: form.menuicon?.trim() || null,
      };

      if (!payload.menuid || !payload.menuname) {
        setError("Menu ID and Menu Name are required.");
        return;
      }

      if (editingRow) {
        const updated = await updateSchema(editingRow.itemid, payload);
        setRows((prev) => prev.map((row) => (row.itemid === updated.itemid ? updated : row)));
      } else {
        const created = await createSchema(payload);
        setRows((prev) => [...prev, created].sort((a, b) => a.itemid - b.itemid));
      }

      setShowModal(false);
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save system menu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemid: number) {
    if (!window.confirm("Delete this system menu entry?")) return;
    try {
      setDeletingId(itemid);
      setError(null);
      await deleteSchema(itemid);
      setRows((prev) => prev.filter((row) => row.itemid !== itemid));
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete system menu entry.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredIcons = ALL_LUCIDE_ICONS.filter((name) => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 120);

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border border-slate-800 bg-[#1a2436] p-5 text-slate-100 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.9)]">
        <div className="flex flex-col gap-4 border-b border-slate-700/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Schema List</h1>
              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-200">{counts.M} Menus</span>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">{counts.P} Programs</span>
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">{counts.S} Submenus</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">System menu registry with direct schema maintenance.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-xl border border-slate-600 bg-slate-700/50 pl-9 pr-3 text-sm text-white outline-none transition focus:border-blue-400"
              />
            </div>
            <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700/80 bg-[#101a2b]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#081224]">
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-4 py-3 font-semibold">Menu ID</th>
                  <th className="px-4 py-3 font-semibold">Menu Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Menu Command</th>
                  <th className="px-4 py-3 font-semibold">Object Code</th>
                  <th className="px-4 py-3 font-semibold">Icon</th>
                  <th className="px-4 py-3 font-semibold">UDF</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={`schema-skeleton-${i}`} className="border-t border-slate-800">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20 bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40 bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28 bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24 bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24 bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-12 rounded-full bg-slate-700" /></td>
                      <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-20 rounded-lg bg-slate-700" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      No system menu entries found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const IconComponent = row.menuicon ? (LucideIcons as Record<string, any>)[row.menuicon] : null;
                    return (
                      <tr key={row.itemid} className="group border-t border-slate-800 text-slate-200 transition hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-white">{row.menuid || "-"}</td>
                        <td className="px-4 py-3"><div className="font-medium text-white">{row.menuname}</div></td>
                        <td className="px-4 py-3"><SchemaTypeBadge type={row.menutype} /></td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.menucmd || "-"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.objectcode || "-"}</td>
                        <td className="px-4 py-3 text-slate-300">
                          <div className="flex items-center gap-2">
                            {IconComponent ? <IconComponent className="h-4 w-4 text-slate-200" /> : null}
                            <span>{row.menuicon || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", row.udfmaintained ? "bg-emerald-500/15 text-emerald-200" : "bg-slate-700 text-slate-300")}>
                            {row.udfmaintained ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                            <button onClick={() => openEdit(row)} className="rounded-lg p-2 text-slate-300 transition hover:bg-blue-500/10 hover:text-blue-200" aria-label={`Edit ${row.menuname}`}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(row.itemid)} disabled={deletingId === row.itemid} className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50" aria-label={`Delete ${row.menuname}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-slate-700 bg-[#101a2b] p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{editingRow ? "Edit System Menu" : "Add System Menu"}</h2>
                <p className="text-sm text-slate-400">Maintain the `schemas` table entries from the admin panel.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Menu ID">
                    <input value={form.menuid} onChange={(e) => setForm((prev) => ({ ...prev, menuid: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-white outline-none transition focus:border-blue-400" />
                  </Field>
                  <Field label="Menu Name">
                    <input value={form.menuname} onChange={(e) => setForm((prev) => ({ ...prev, menuname: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-white outline-none transition focus:border-blue-400" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Menu Command">
                    <input value={form.menucmd ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, menucmd: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-white outline-none transition focus:border-blue-400" />
                  </Field>
                  <Field label="Object Code">
                    <input value={form.objectcode ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, objectcode: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-white outline-none transition focus:border-blue-400" />
                  </Field>
                </div>

                <Field label="Type">
                  <div className="grid grid-cols-3 gap-2">
                    {(["M", "S", "P"] as SchemaMenuType[]).map((type) => {
                      const meta = MENU_TYPE_META[type];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, menutype: type }))}
                          className={cn("flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition", form.menutype === type ? meta.badgeClass : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500")}
                        >
                          <Icon className="h-4 w-4" />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">UDF Maintained</p>
                    <p className="text-xs text-slate-400">Marks entries maintained through custom logic.</p>
                  </div>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, udfmaintained: !prev.udfmaintained }))} className={cn("relative h-6 w-11 rounded-full transition", form.udfmaintained ? "bg-emerald-500" : "bg-slate-600")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition", form.udfmaintained ? "left-5" : "left-0.5")} />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <Field label="Menu Icon">
                  <input value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} placeholder="Search icon" className="mb-3 h-10 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-blue-400" />
                  <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
                    {filteredIcons.map((iconName) => {
                      const IconComponent = (LucideIcons as Record<string, any>)[iconName];
                      const active = form.menuicon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, menuicon: iconName }))}
                          className={cn("flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center text-[10px] transition", active ? "border-blue-500 bg-blue-500/15 text-blue-100" : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500")}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span className="line-clamp-2">{iconName}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="mt-4 rounded-xl border border-slate-800 bg-[#0b1321] px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Selected Icon</p>
                  <div className="mt-2 flex items-center gap-2">
                    {form.menuicon && (LucideIcons as Record<string, any>)[form.menuicon] ? (
                      (() => {
                        const IconComponent = (LucideIcons as Record<string, any>)[form.menuicon as string];
                        return <IconComponent className="h-5 w-5 text-blue-300" />;
                      })()
                    ) : (
                      <Settings className="h-5 w-5 text-slate-500" />
                    )}
                    <span className="text-sm text-white">{form.menuicon || "No icon selected"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
                {saving ? "Saving..." : editingRow ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
