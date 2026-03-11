import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

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

export function MenuUserAuthorizationPanel() {
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);
  const [schemas, setSchemas] = useState<SchemaRow[]>([]);
  const [selectedAdminKey, setSelectedAdminKey] = useState("");
  const [authorizations, setAuthorizations] = useState<MenuAuthorizationRow[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const selectedAdmin = useMemo(
    () => adminOptions.find((option) => option.key === selectedAdminKey) ?? null,
    [adminOptions, selectedAdminKey]
  );

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
      const [{ data: membershipsData, error: membershipsError }, { data: schemasData, error: schemasError }] = await Promise.all([
        supabase.from("user_memberships").select("user_id,business_id").eq("role", "admin").order("created_at", { ascending: true }),
        supabase.from("schemas").select("itemid,menuid,menuname,menucmd,objectcode,menutype,menuicon,udfmaintained").order("itemid", { ascending: true }),
      ]);

      if (membershipsError) throw membershipsError;
      if (schemasError) throw schemasError;

      const memberships = (membershipsData ?? []) as MembershipRow[];
      const userIds = Array.from(new Set(memberships.map((row) => row.user_id).filter(Boolean)));
      const businessIds = Array.from(new Set(memberships.map((row) => row.business_id).filter(Boolean))) as string[];

      const [{ data: usersData, error: usersError }, { data: businessesData, error: businessesError }] = await Promise.all([
        userIds.length ? supabase.from("users").select("id,email,full_name,user_id,business_id").in("id", userIds) : Promise.resolve({ data: [], error: null }),
        businessIds.length ? supabase.from("businesses").select("id,name").in("id", businessIds) : Promise.resolve({ data: [], error: null }),
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
          const displayName = user.full_name?.trim() || user.user_id?.trim() || user.email?.split("@")[0] || "Admin User";
          const businessName = membership.business_id ? businesses.get(membership.business_id) ?? "Unknown Business" : "No Business";
          return {
            key: `${membership.user_id}:${membership.business_id ?? "none"}`,
            userId: membership.user_id,
            businessId: membership.business_id,
            label: displayName,
            sublabel: `${user.email ?? "No email"}${businessName ? ` · ${businessName}` : ""}`,
          } satisfies AdminOption;
        })
        .filter((value): value is AdminOption => Boolean(value))
        .sort((a, b) => a.label.localeCompare(b.label));

      setAdminOptions(options);
      setSchemas((schemasData ?? []) as SchemaRow[]);
      setSelectedAdminKey((current) => current || options[0]?.key || "");
      setExpandedMenus(new Set(((schemasData ?? []) as SchemaRow[]).filter((row) => row.menutype === "M" && !row.menuid).map((row) => row.menucmd)));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to load menu authorization data.",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: error?.message ?? "Failed to load authorizations.",
        variant: "destructive",
      });
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
    if (!supabase || !selectedAdmin) {
      toast({
        title: "Warning",
        description: "Please select an admin user first.",
        variant: "destructive",
      });
      return;
    }

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

      const { error } = await supabase.from("user_menu_authorizations").upsert(payload, {
        onConflict: "user_id,menucmd",
      });

      if (error) throw error;

      await fetchAuthorizations(selectedAdmin.userId);
      toast({
        title: "Success",
        description: `Authorization updated for ${payload.length} item(s).`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to update authorization.",
        variant: "destructive",
      });
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
      ...topPrograms.map((program) => ({
        ...program,
        subMenus: [],
        programs: [],
      })),
    ];
  }

  function renderPrograms(programs: SchemaRow[], level = 1) {
    return programs.map((program) => (
      <div
        key={program.itemid}
        className="flex items-center justify-between gap-3 border-t border-slate-800/70 py-2.5 pr-4"
        style={{ paddingLeft: `${1 + level * 1.15}rem` }}
      >
        <span className="flex-1 text-sm text-slate-200">{program.menuname}</span>
        <select
          value={getAccessLevel(program.menucmd)}
          onChange={(e) => handleAccessChange(program.menucmd, e.target.value as "FULL" | "NONE")}
          className="rounded-lg border border-slate-600 bg-slate-700/70 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400"
          disabled={!selectedAdmin || authLoading}
        >
          <option value="NONE">None</option>
          <option value="FULL">Full Access</option>
        </select>
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
            className="flex items-center justify-between gap-3 border-t border-slate-800/70 py-2.5 pr-4 transition hover:bg-slate-800/30"
            style={{ paddingLeft: `${1 + level * 1.15}rem` }}
          >
            <button
              type="button"
              className="flex flex-1 items-center gap-2 text-left"
              onClick={() => hasChildren && toggleMenu(subMenu.menucmd)}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
              ) : (
                <span className="w-4" />
              )}
              <span className="text-sm font-medium text-slate-200">{subMenu.menuname}</span>
            </button>

            <select
              value={getAccessLevel(subMenu.menucmd)}
              onChange={(e) => handleAccessChange(subMenu.menucmd, e.target.value as "FULL" | "NONE")}
              className="rounded-lg border border-slate-600 bg-slate-700/70 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400"
              disabled={!selectedAdmin || authLoading}
            >
              <option value="NONE">None</option>
              <option value="FULL">Full Access</option>
            </select>
          </div>

          {isExpanded && nestedPrograms.length > 0 && renderPrograms(nestedPrograms, level + 1)}
        </div>
      );
    });
  }

  const hierarchy = getMenuHierarchy();

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-[#1a2436] p-4">
          <Skeleton className="mb-3 h-5 w-24 bg-slate-700" />
          <Skeleton className="h-10 w-full bg-slate-700" />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#1a2436] p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-12 w-full bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border border-slate-800 bg-[#1a2436] p-5 text-slate-100 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.9)]">
        <div className="border-b border-slate-700/80 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Menu User Authorization</h1>
          <p className="mt-1 text-sm text-slate-400">Assign menu access per admin user across the system menu tree.</p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-slate-700/80 bg-[#101a2b] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
              <UserRound className="h-4 w-4" />
              Admin Users
            </div>

            <select
              value={selectedAdminKey}
              onChange={(e) => setSelectedAdminKey(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-700/70 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
            >
              <option value="">Select an admin user...</option>
              {adminOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            {selectedAdmin && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Admin</p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedAdmin.label}</p>
                <p className="mt-1 text-xs text-slate-400">{selectedAdmin.sublabel}</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#101a2b]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#081224] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>Module / Program</span>
              <span>Access Level</span>
            </div>

            <div className="max-h-[65vh] overflow-auto">
              {!selectedAdmin ? (
                <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-sm text-slate-400">
                  Select an admin user to manage menu authorization.
                </div>
              ) : authLoading ? (
                <div className="p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="mb-3 h-11 w-full bg-slate-700" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {hierarchy.map((item) => {
                    const isExpanded = expandedMenus.has(item.menucmd);
                    const hasChildren = item.subMenus.length > 0 || item.programs.length > 0;

                    return (
                      <div key={item.itemid}>
                        <div className="flex items-center justify-between gap-3 bg-slate-800/25 px-4 py-3 transition hover:bg-slate-800/40">
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-2 text-left"
                            onClick={() => hasChildren && toggleMenu(item.menucmd)}
                          >
                            {hasChildren ? (
                              isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-slate-500" />
                            )}
                            <span className="text-sm font-semibold text-white">{item.menuname}</span>
                          </button>

                          <select
                            value={getAccessLevel(item.menucmd)}
                            onChange={(e) => handleAccessChange(item.menucmd, e.target.value as "FULL" | "NONE")}
                            className="rounded-lg border border-slate-600 bg-slate-700/70 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400"
                            disabled={!selectedAdmin || authLoading}
                          >
                            <option value="NONE">None</option>
                            <option value="FULL">Full Access</option>
                          </select>
                        </div>

                        {isExpanded && (
                          <div className="bg-[#101a2b]">
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
    </div>
  );
}
