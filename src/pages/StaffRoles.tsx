import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  buildStaffLoginCredentials,
  createStaffMemberWithAuth,
  createStaffRole,
  listStaffMembers,
  listStaffRoles,
  type StaffMemberRow,
  type StaffRoleRow,
} from "@/lib/staff";
import { Plus, Search, Shield, Users, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_ROLES: StaffRoleRow[] = [
  { id: "r1", name: "Admin", code: "ADMIN", description: "Full business access", is_active: true },
  { id: "r2", name: "Cashier", code: "CASHIER", description: "POS and transactions", is_active: true },
  { id: "r3", name: "Inventory Clerk", code: "INV", description: "Item and stock operations", is_active: true },
];

const DEMO_STAFF: StaffMemberRow[] = [
  {
    id: "s1",
    first_name: "Maria",
    last_name: "Santos",
    email: "maria@biz.com",
    phone: "+63 917 111 1111",
    employee_code: "EMP-001",
    status: "active",
    hired_at: "2025-01-10",
    role_id: "r1",
    role_name: "Admin",
    branch_id: "br1",
    branch_name: "Main Branch",
  },
  {
    id: "s2",
    first_name: "Jose",
    last_name: "Reyes",
    email: "jose@biz.com",
    phone: "+63 917 222 2222",
    employee_code: "EMP-002",
    status: "active",
    hired_at: "2025-03-15",
    role_id: "r2",
    role_name: "Cashier",
    branch_id: "br1",
    branch_name: "Main Branch",
  },
];

type RoleForm = {
  name: string;
  code: string;
  description: string;
};

type StaffForm = {
  firstName: string;
  lastName: string;
  userId: string;
  loginEmail: string;
  loginPassword: string;
  membershipRole: "admin" | "cashier";
  email: string;
  phone: string;
  employeeCode: string;
  roleId: string;
  branchId: string;
  status: "active" | "inactive" | "suspended";
  hiredAt: string;
};

const DEFAULT_ROLE_FORM: RoleForm = { name: "", code: "", description: "" };
const DEFAULT_STAFF_FORM: StaffForm = {
  firstName: "",
  lastName: "",
  userId: "",
  loginEmail: "",
  loginPassword: "",
  membershipRole: "cashier",
  email: "",
  phone: "",
  employeeCode: "",
  roleId: "",
  branchId: "",
  status: "active",
  hiredAt: "",
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function StaffRoles() {
  const { currentBusiness } = useApp();
  const [searchRole, setSearchRole] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [roles, setRoles] = useState<StaffRoleRow[]>([]);
  const [staff, setStaff] = useState<StaffMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleForm>(DEFAULT_ROLE_FORM);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [staffOpen, setStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffForm>(DEFAULT_STAFF_FORM);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
          if (active) {
            setRoles(DEMO_ROLES);
            setStaff(DEMO_STAFF);
          }
          return;
        }

        const [roleRows, staffRows] = await Promise.all([
          listStaffRoles(currentBusiness.id, searchRole),
          listStaffMembers(currentBusiness.id, searchStaff),
        ]);
        if (!active) return;
        setRoles(roleRows);
        setStaff(staffRows);
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? "Failed to load staff and roles.");
          setRoles(DEMO_ROLES);
          setStaff(DEMO_STAFF);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentBusiness.id, searchRole, searchStaff, refreshKey]);

  const metrics = useMemo(() => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.status === "active").length;
    return {
      totalRoles: roles.length,
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
    };
  }, [roles, staff]);

  function openAddRole() {
    setRoleError(null);
    setRoleForm(DEFAULT_ROLE_FORM);
    setRoleOpen(true);
  }

  function openAddStaff() {
    setStaffError(null);
    setStaffInfo(null);
    setStaffForm({
      ...DEFAULT_STAFF_FORM,
      roleId: roles[0]?.id ?? "",
      branchId: currentBusiness.branches[0]?.id ?? "",
      userId: "",
      loginEmail: "",
      loginPassword: "",
    });
    setStaffOpen(true);
  }

  useEffect(() => {
    if (!staffOpen) return;
    const uid = staffForm.userId.trim();
    if (!uid) {
      setStaffForm((p) => ({ ...p, loginEmail: "", loginPassword: "" }));
      return;
    }
    const creds = buildStaffLoginCredentials(uid, currentBusiness.name);
    setStaffForm((p) => ({
      ...p,
      loginEmail: creds.email,
      loginPassword: creds.password,
    }));
  }, [staffForm.userId, currentBusiness.name, staffOpen]);

  async function onCreateRole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = roleForm.name.trim();
    if (!name) {
      setRoleError("Role name is required.");
      return;
    }

    try {
      setRoleLoading(true);
      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        setRoles((prev) => [
          {
            id: `${Date.now()}`,
            name,
            code: roleForm.code.trim() || null,
            description: roleForm.description.trim() || null,
            is_active: true,
          },
          ...prev,
        ]);
      } else {
        await createStaffRole({
          businessId: currentBusiness.id,
          name,
          code: roleForm.code,
          description: roleForm.description,
        });
        setRefreshKey((k) => k + 1);
      }
      setRoleOpen(false);
    } catch (err: any) {
      setRoleError(err?.message ?? "Failed to create role.");
    } finally {
      setRoleLoading(false);
    }
  }

  async function onCreateStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!staffForm.firstName.trim() || !staffForm.lastName.trim()) {
      setStaffError("First name and last name are required.");
      return;
    }
    if (!staffForm.userId.trim()) {
      setStaffError("User ID is required.");
      return;
    }
    if (!staffForm.loginEmail || !staffForm.loginPassword) {
      setStaffError("Login credentials could not be generated.");
      return;
    }

    try {
      setStaffLoading(true);
      setStaffError(null);
      setStaffInfo(null);
      if (!isSupabaseConfigured || !isUuid(currentBusiness.id)) {
        const roleName = roles.find((r) => r.id === staffForm.roleId)?.name ?? null;
        const branchName = currentBusiness.branches.find((b) => b.id === staffForm.branchId)?.name ?? null;
        setStaff((prev) => [
          {
            id: `${Date.now()}`,
            first_name: staffForm.firstName.trim(),
            last_name: staffForm.lastName.trim(),
            email: staffForm.loginEmail,
            phone: staffForm.phone.trim() || null,
            employee_code: staffForm.employeeCode.trim() || null,
            status: staffForm.status,
            hired_at: staffForm.hiredAt || null,
            role_id: staffForm.roleId || null,
            role_name: roleName,
            branch_id: staffForm.branchId || null,
            branch_name: branchName,
          },
          ...prev,
        ]);
        setStaffInfo(`Staff login created: ${staffForm.loginEmail} / ${staffForm.loginPassword}`);
      } else {
        await createStaffMemberWithAuth({
          businessId: currentBusiness.id,
          roleId: staffForm.roleId || null,
          branchId: staffForm.branchId || null,
          firstName: staffForm.firstName,
          lastName: staffForm.lastName,
          email: staffForm.email,
          phone: staffForm.phone,
          employeeCode: staffForm.employeeCode,
          status: staffForm.status,
          hiredAt: staffForm.hiredAt || null,
          userId: staffForm.userId,
          loginEmail: staffForm.loginEmail,
          loginPassword: staffForm.loginPassword,
          membershipRole: staffForm.membershipRole,
        });
        setRefreshKey((k) => k + 1);
        setStaffInfo(`Staff login created: ${staffForm.loginEmail} / ${staffForm.loginPassword}`);
      }
      setStaffOpen(false);
    } catch (err: any) {
      setStaffError(err?.message ?? "Failed to create staff member.");
    } finally {
      setStaffLoading(false);
    }
  }

  return (
    <AppLayout title="Staff & Roles">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Roles", value: String(metrics.totalRoles), icon: Shield, color: "from-blue-500 to-indigo-500" },
            { label: "Total Staff", value: String(metrics.totalStaff), icon: Users, color: "from-cyan-500 to-sky-500" },
            { label: "Active Staff", value: String(metrics.activeStaff), icon: UserPlus, color: "from-success to-emerald-400" },
            { label: "Inactive Staff", value: String(metrics.inactiveStaff), icon: Users, color: "from-warning to-orange-400" },
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

        {error && <div className="rounded-xl border border-warning/30 bg-warning-muted/40 px-3 py-2 text-xs text-warning">{error}</div>}
        {staffInfo && <div className="rounded-xl border border-success/30 bg-success-muted/40 px-3 py-2 text-xs text-success">{staffInfo}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                  placeholder="Search roles..."
                  className="bg-transparent text-sm outline-none flex-1"
                />
              </div>
              <button onClick={openAddRole} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary">
                <Plus className="w-4 h-4" /> Add Role
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Role", "Code", "Description", "Status"].map((h) => (
                      <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`role-skeleton-${i}`} className="border-b border-border">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-52" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      </tr>
                    ))
                  ) : roles.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No roles found.</td></tr>
                  ) : (
                    roles.map((r, i) => (
                      <motion.tr key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{r.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{r.code || "-"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{r.description || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", r.is_active ? "bg-success-muted text-success" : "bg-muted text-muted-foreground")}>
                            {r.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={searchStaff}
                  onChange={(e) => setSearchStaff(e.target.value)}
                  placeholder="Search staff..."
                  className="bg-transparent text-sm outline-none flex-1"
                />
              </div>
              <button onClick={openAddStaff} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary">
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Name", "Role", "Branch", "Contact", "Status"].map((h) => (
                      <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`staff-skeleton-${i}`} className="border-b border-border">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      </tr>
                    ))
                  ) : staff.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No staff members found.</td></tr>
                  ) : (
                    staff.map((s, i) => (
                      <motion.tr key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground">{s.first_name} {s.last_name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.employee_code || "-"}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.role_name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.branch_name || "-"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.email || s.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", s.status === "active" ? "bg-success-muted text-success" : s.status === "suspended" ? "bg-warning-muted text-warning" : "bg-muted text-muted-foreground")}>
                            {s.status}
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
      </div>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={onCreateRole} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>Create a role for your business staff.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role name</Label>
                <Input id="role-name" value={roleForm.name} onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-code">Role code</Label>
                <Input id="role-code" value={roleForm.code} onChange={(e) => setRoleForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Textarea id="role-description" rows={3} value={roleForm.description} onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            {roleError && <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{roleError}</div>}
            <DialogFooter>
              <button type="button" onClick={() => setRoleOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={roleLoading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70">
                {roleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {roleLoading ? "Saving..." : "Create Role"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={onCreateStaff} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Staff</DialogTitle>
              <DialogDescription>Create a staff record and assign role/branch.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-first">First name</Label>
                <Input id="staff-first" value={staffForm.firstName} onChange={(e) => setStaffForm((p) => ({ ...p, firstName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-last">Last name</Label>
                <Input id="staff-last" value={staffForm.lastName} onChange={(e) => setStaffForm((p) => ({ ...p, lastName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-userid">User ID</Label>
                <Input
                  id="staff-userid"
                  value={staffForm.userId}
                  onChange={(e) => setStaffForm((p) => ({ ...p, userId: e.target.value }))}
                  placeholder="e.g. cashier01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>System role</Label>
                <Select value={staffForm.membershipRole} onValueChange={(v: "admin" | "cashier") => setStaffForm((p) => ({ ...p, membershipRole: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">cashier</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="staff-login-email">Login email (auto)</Label>
                <Input id="staff-login-email" value={staffForm.loginEmail} readOnly className="bg-secondary/40" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="staff-login-password">Default password (auto)</Label>
                <Input id="staff-login-password" value={staffForm.loginPassword} readOnly className="bg-secondary/40 font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Contact email</Label>
                <Input id="staff-email" type="email" value={staffForm.email} onChange={(e) => setStaffForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone</Label>
                <Input id="staff-phone" value={staffForm.phone} onChange={(e) => setStaffForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-code">Employee code</Label>
                <Input id="staff-code" value={staffForm.employeeCode} onChange={(e) => setStaffForm((p) => ({ ...p, employeeCode: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={staffForm.roleId || "__none"} onValueChange={(v) => setStaffForm((p) => ({ ...p, roleId: v === "__none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No role</SelectItem>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={staffForm.branchId || "__none"} onValueChange={(v) => setStaffForm((p) => ({ ...p, branchId: v === "__none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No branch</SelectItem>
                    {currentBusiness.branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={staffForm.status} onValueChange={(v: "active" | "inactive" | "suspended") => setStaffForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-hired">Hired date</Label>
                <Input id="staff-hired" type="date" value={staffForm.hiredAt} onChange={(e) => setStaffForm((p) => ({ ...p, hiredAt: e.target.value }))} />
              </div>
            </div>
            {staffError && <div className="rounded-lg border border-danger/20 bg-danger-muted/50 px-3 py-2 text-sm text-danger">{staffError}</div>}
            {staffInfo && <div className="rounded-lg border border-success/20 bg-success-muted/50 px-3 py-2 text-sm text-success">{staffInfo}</div>}
            <DialogFooter>
              <button type="button" onClick={() => setStaffOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" disabled={staffLoading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-primary disabled:opacity-70">
                {staffLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {staffLoading ? "Saving..." : "Create Staff"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
