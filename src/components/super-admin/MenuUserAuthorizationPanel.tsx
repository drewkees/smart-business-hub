import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ShieldCheck, UserRound, Search, RefreshCw, Lock, Unlock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SchemaRow = {
  itemid: number;
  menuid: string | null;
  menuname: string;
  menucmd: string;
  objectcode: string | null;
  menutype: "M" | "S" | "P" | string;
  menuicon: string | null;
  udfmaintained: boolean | null;
};

type MembershipRow = {
  user_id: string;
  business_id: string | null;
};

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  user_id: string | null;
  business_id: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
};

type MenuAuthorizationRow = {
  id?: number;
  user_id: string;
  menucmd: string;
  accesslevel: "FULL" | "NONE";
};

type AdminOption = {
  key: string;
  userId: string;
  businessId: string | null;
  label: string;
  sublabel: string;
};

type SchemaNode = SchemaRow & {
  subMenus: SchemaRow[];
  programs: SchemaRow[];
};

function AccessToggle({
  value,
  onChange,
  disabled,
}: {
  value: "FULL" | "NONE";
  onChange: (v: "FULL" | "NONE") => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value === "FULL" ? "NONE" : "FULL")}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition",
        value === "FULL"
          ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
          : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 border border-slate-700",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {value === "FULL" ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {value === "FULL" ? "Full" : "None"}
    </button>
  );
}

export function MenuUserAuthorizationPanel() {
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);
  const [schemas, setSchemas] = useState<SchemaRow[]>([]);
  const [selectedAdminKey, setSelectedAdminKey] = useState("");
  const [authorizations, setAuthorizations] = useState<MenuAuthorizationRow[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const selectedAdmin = useMemo(
    () => adminOptions.find((option) => option.key === selectedAdminKey) ?? null,
    [adminOptions, selectedAdminKey],
  );

  const filteredOptions = useMemo(() => {
    const q = userSearch.toLowerCase();
    if (!q) return adminOptions;
    return adminOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.sublabel.toLowerCase().includes(q),
    );
  }, [adminOptions, userSearch]);

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (!selectedAdmin) {
      setAuthorizations([]);
      return;
    }
    void fetchAuthorizations(selectedAdmin.userId);
  }, [selectedAdmin]);

  async function fetchData() {
    if (!supabase) return;
    try {
      setLoading(true);
      const [{ data: membershipsData, error: membershipsError }, { data: schemasData, error: schemasError }] =
        await Promise.all([
          supabase
            .from("user_memberships")
            .select("user_id,business_id")
            .eq("role", "admin")
            .order("created_at", { ascending: true }),
          supabase
            .from("schemas")
            .select("itemid,menuid,menuname,menucmd,objectcode,menutype,menuicon,udfmaintained")
            .order("itemid", { ascending: true }),
        ]);

      if (membershipsError) throw membershipsError;
      if (schemasError) throw schemasError;

      const memberships = (membershipsData ?? []) as MembershipRow[];
      const userIds = Array.from(new Set(memberships.map((row) => row.user_id).filter(Boolean)));
      const businessIds = Array.from(
        new Set(memberships.map((row) => row.business_id).filter(Boolean)),
      ) as string[];

      const [{ data: usersData, error: usersError }, { data: businessesData, error: businessesError }] =
        await Promise.all([
          userIds.length
            ? supabase.from("users").select("id,email,full_name,user_id,business_id").in("id", userIds)
            : Promise.resolve({ data: [], error: null }),
          businessIds.length
            ? supabase.from("businesses").select("id,name").in("id", businessIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (usersError) throw usersError;
      if (businessesError) throw businessesError;

      const users = (usersData ?? []) as UserRow[];
      const businesses = new Map(((businessesData ?? []) as BusinessRow[]).map((row) => [row.id, row.name]));
      const usersById = new Map(users.map((row) => [row.id, row]));

      const options = memberships
        .map((membership) => {
          const user = usersById.get(membership.user_id);
          if (!user) return null;
          const displayName =
            user.full_name?.trim() || user.user_id?.trim() || user.email?.split("@")[0] || "Admin User";
          const businessName = membership.business_id
            ? (businesses.get(membership.business_id) ?? "Unknown Business")
            : "No Business";
          return {
            key: `${membership.user_id}:${membership.business_id ?? "none"}`,
            userId: membership.user_id,
            businessId: membership.business_id,
            label: displayName,
            sublabel: `${user.email ?? "No email"} · ${businessName}`,
          } satisfies AdminOption;
        })
        .filter((value): value is AdminOption => Boolean(value))
        .sort((a, b) => a.label.localeCompare(b.label));

      setAdminOptions(options);
      setSchemas((schemasData ?? []) as SchemaRow[]);
      setSelectedAdminKey((current) => current || options[0]?.key || "");
      setExpandedMenus(
        new Set(
          ((schemasData ?? []) as SchemaRow[])
            .filter((row) => row.menutype === "M" && !row.menuid)
            .map((row) => row.menucmd),
        ),
      );
    } catch (error: any) {
      toast({ title: "Error", description: error?.message ?? "Failed to load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuthorizations(userId: string) {
    if (!supabase) return;
    try {
      setAuthLoading(true);
      const { data, error } = await supabase
        .from("user_menu_authorizations")
        .select("id,user_id,menucmd,accesslevel")
        .eq("user_id", userId);
      if (error) throw error;
      setAuthorizations((data ?? []) as MenuAuthorizationRow[]);
    } catch (error: any) {
      setAuthorizations([]);
      toast({ title: "Error", description: error?.message ?? "Failed to load authorizations.", variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  }

  function getAccessLevel(menucmd: string): "FULL" | "NONE" {
    return authorizations.find((row) => row.menucmd === menucmd)?.accesslevel ?? "NONE";
  }

  function getDescendantCommands(parentCmd: string): string[] {
    const directChildren = schemas.filter((row) => (row.menuid ?? "") === parentCmd);
    return directChildren.flatMap((child) => [child.menucmd, ...getDescendantCommands(child.menucmd)]);
  }

  function getAncestorCommands(schema: SchemaRow | undefined): string[] {
    const result: string[] = [];
    let currentParent = schema?.menuid ?? "";
    while (currentParent) {
      const parent = schemas.find((row) => row.menucmd === currentParent);
      if (!parent) break;
      result.push(parent.menucmd);
      currentParent = parent.menuid ?? "";
    }
    return result;
  }

  async function handleAccessChange(menucmd: string, accessLevel: "FULL" | "NONE") {
    if (!supabase || !selectedAdmin) return;
    try {
      const schemaItem = schemas.find((row) => row.menucmd === menucmd);
      const affectedMenuCmds = new Set<string>([menucmd, ...getDescendantCommands(menucmd)]);
      if (accessLevel === "FULL") {
        getAncestorCommands(schemaItem).forEach((cmd) => affectedMenuCmds.add(cmd));
      }
      const payload = Array.from(affectedMenuCmds).map((cmd) => ({
        user_id: selectedAdmin.userId,
        menucmd: cmd,
        accesslevel: accessLevel,
      }));
      const { error } = await supabase
        .from("user_menu_authorizations")
        .upsert(payload, { onConflict: "user_id,menucmd" });
      if (error) throw error;
      await fetchAuthorizations(selectedAdmin.userId);
      toast({ title: "Updated", description: `Access updated for ${payload.length} item(s).` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message ?? "Failed to update authorization.", variant: "destructive" });
    }
  }

  function toggleMenu(menucmd: string) {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menucmd)) next.delete(menucmd);
      else next.add(menucmd);
      return next;
    });
  }

  function getMenuHierarchy(): SchemaNode[] {
    const topMenus = schemas.filter((row) => row.menutype === "M" && (!row.menuid || row.menuid === ""));
    const topPrograms = schemas.filter((row) => row.menutype === "P" && (!row.menuid || row.menuid === ""));
    return [
      ...topMenus.map((menu) => ({
        ...menu,
        subMenus: schemas.filter((row) => row.menutype === "S" && row.menuid === menu.menucmd),
        programs: schemas.filter((row) => row.menutype === "P" && row.menuid === menu.menucmd),
      })),
      ...topPrograms.map((program) => ({ ...program, subMenus: [], programs: [] })),
    ];
  }

  // Count full-access items for selected user
  const fullCount = authorizations.filter((a) => a.accesslevel === "FULL").length;

  function renderPrograms(programs: SchemaRow[], level = 1) {
    return programs.map((program) => (
      <div
        key={program.itemid}
        className="flex items-center justify-between gap-3 border-t border-slate-800/50 py-2 pr-4"
        style={{ paddingLeft: `${0.75 + level * 1.1}rem` }}
      >
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="h-1 w-1 shrink-0 rounded-full bg-slate-600" />
          <span className="truncate text-sm text-slate-300">{program.menuname}</span>
          {program.objectcode && (
            <span className="hidden shrink-0 font-mono text-[10px] text-slate-600 sm:block">
              {program.objectcode}
            </span>
          )}
        </div>
        <AccessToggle
          value={getAccessLevel(program.menucmd)}
          onChange={(v) => handleAccessChange(program.menucmd, v)}
          disabled={!selectedAdmin || authLoading}
        />
      </div>
    ));
  }

  function renderSubMenus(subMenus: SchemaRow[], level = 1) {
    return subMenus.map((subMenu) => {
      const isExpanded = expandedMenus.has(subMenu.menucmd);
      const nestedPrograms = schemas.filter((row) => row.menutype === "P" && row.menuid === subMenu.menucmd);
      const hasChildren = nestedPrograms.length > 0;
      return (
        <div key={subMenu.itemid}>
          <div
            className="flex items-center justify-between gap-3 border-t border-slate-800/50 py-2 pr-4 transition hover:bg-slate-800/20"
            style={{ paddingLeft: `${0.75 + level * 1.1}rem` }}
          >
            <button
              type="button"
              className="flex flex-1 items-center gap-2 text-left min-w-0"
              onClick={() => hasChildren && toggleMenu(subMenu.menucmd)}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                )
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="truncate text-sm font-medium text-slate-200">{subMenu.menuname}</span>
              {nestedPrograms.length > 0 && (
                <span className="shrink-0 text-[10px] text-slate-600">{nestedPrograms.length} items</span>
              )}
            </button>
            <AccessToggle
              value={getAccessLevel(subMenu.menucmd)}
              onChange={(v) => handleAccessChange(subMenu.menucmd, v)}
              disabled={!selectedAdmin || authLoading}
            />
          </div>
          {isExpanded && nestedPrograms.length > 0 && renderPrograms(nestedPrograms, level + 1)}
        </div>
      );
    });
  }

  const hierarchy = getMenuHierarchy();

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="mb-2 h-8 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-80 bg-slate-800/70" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
          <div className="rounded-2xl border border-slate-700/80 bg-[#1a2436] p-4 space-y-3">
            <Skeleton className="h-4 w-20 bg-slate-700" />
            <Skeleton className="h-10 w-full bg-slate-700" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-slate-700/60" />)}
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-[#1a2436] p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-slate-700" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Menu Authorization</h1>
        <p className="text-sm text-slate-400">Assign menu access per admin user across the system menu tree.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        {/* User picker */}
        <div className="rounded-[24px] border border-slate-700/80 bg-[#1a2436] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <UserRound className="h-3.5 w-3.5" />
            Admin Users
          </div>

          {/* Search users */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search admins…"
              className="h-9 w-full rounded-xl border border-slate-700 bg-slate-900/60 pl-8 pr-3 text-xs text-white placeholder-slate-600 outline-none transition focus:border-blue-400"
            />
          </div>

          <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-600">No admins found.</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedAdminKey === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setSelectedAdminKey(option.key)}
                    className={cn(
                      "w-full rounded-xl p-3 text-left transition",
                      isSelected
                        ? "bg-blue-600/20 border border-blue-500/40"
                        : "border border-transparent hover:bg-slate-800/60",
                    )}
                  >
                    <p className={cn("text-sm font-semibold truncate", isSelected ? "text-blue-200" : "text-white")}>
                      {option.label}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{option.sublabel}</p>
                  </button>
                );
              })
            )}
          </div>

          {selectedAdmin && (
            <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Access Summary</p>
                <button
                  onClick={() => fetchAuthorizations(selectedAdmin.userId)}
                  disabled={authLoading}
                  className="text-slate-600 hover:text-slate-400 transition"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", authLoading && "animate-spin")} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-emerald-400">{fullCount}</p>
                  <p className="text-[10px] text-slate-500">Full access items</p>
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-slate-400">{schemas.length - fullCount}</p>
                  <p className="text-[10px] text-slate-500">No access</p>
                </div>
              </div>
              {schemas.length > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((fullCount / schemas.length) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu tree */}
        <div className="overflow-hidden rounded-[24px] border border-slate-700/80 bg-[#1a2436] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#101a2b] px-5 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Menu Access Tree</p>
              <p className="text-[11px] text-slate-500">{hierarchy.length} top-level modules</p>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Access Level
            </div>
          </div>

          <div className="max-h-[65vh] overflow-auto">
            {!selectedAdmin ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-800 bg-slate-900">
                  <ShieldCheck className="h-6 w-6 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500">Select an admin user to manage menu authorization.</p>
              </div>
            ) : authLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full bg-slate-700/60" />
                ))}
              </div>
            ) : (
              <div>
                {hierarchy.map((item) => {
                  const isExpanded = expandedMenus.has(item.menucmd);
                  const hasChildren = item.subMenus.length > 0 || item.programs.length > 0;
                  const access = getAccessLevel(item.menucmd);

                  return (
                    <div key={item.itemid} className="border-b border-slate-800/60 last:border-0">
                      <div className="flex items-center justify-between gap-3 bg-slate-800/20 px-4 py-3 transition hover:bg-slate-800/40">
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2.5 text-left min-w-0"
                          onClick={() => hasChildren && toggleMenu(item.menucmd)}
                        >
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-500/10">
                            {hasChildren ? (
                              isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                              )
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{item.menuname}</p>
                            {hasChildren && (
                              <p className="text-[10px] text-slate-600">
                                {item.subMenus.length > 0 && `${item.subMenus.length} submenus`}
                                {item.subMenus.length > 0 && item.programs.length > 0 && " · "}
                                {item.programs.length > 0 && `${item.programs.length} programs`}
                              </p>
                            )}
                          </div>
                        </button>
                        <AccessToggle
                          value={access}
                          onChange={(v) => handleAccessChange(item.menucmd, v)}
                          disabled={!selectedAdmin || authLoading}
                        />
                      </div>

                      {isExpanded && (
                        <div className="bg-[#0f1a2c]">
                          {item.subMenus.length > 0 && renderSubMenus(item.subMenus)}
                          {item.programs.length > 0 && renderPrograms(item.programs)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
