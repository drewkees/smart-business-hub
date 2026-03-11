import { cn } from "@/lib/utils";

export function formatMoney(n: number) {
  return `P ${n.toLocaleString()}`;
}

export function formatTypeLabel(v: string) {
  return String(v || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .toUpperCase();
}

export function StatusBadge({ status }: { status: "pending" | "active" | "suspended" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        status === "active"
          ? "bg-emerald-100 text-emerald-700"
          : status === "pending"
            ? "bg-amber-100 text-amber-700"
            : "bg-rose-100 text-rose-700"
      )}
    >
      {status.toUpperCase()}
    </span>
  );
}

export function ActionBtn({
  text,
  onClick,
  disabled,
  tone,
}: {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "active" | "pending" | "suspend";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60",
        tone === "active"
          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          : tone === "pending"
            ? "border-amber-300 text-amber-700 hover:bg-amber-50"
            : "border-rose-300 text-rose-700 hover:bg-rose-50"
      )}
    >
      {text}
    </button>
  );
}

export function RowMetric({ label, value, ok, warn }: { label: string; value: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={cn("font-medium", ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-slate-700")}>{value}</span>
    </div>
  );
}

export function TopStat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-emerald-600">{sub}</p>
    </div>
  );
}

export function Tile({ title, value, sub, icon: Icon }: { title: string; value: string; sub: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
