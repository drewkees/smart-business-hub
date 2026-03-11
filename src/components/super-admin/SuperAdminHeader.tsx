import { Bell, Menu } from "lucide-react";

export function SuperAdminHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <button className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100">
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex-1" />
      <Bell className="h-4 w-4 text-slate-500" />
      <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-sm font-semibold text-white">C</div>
    </header>
  );
}
