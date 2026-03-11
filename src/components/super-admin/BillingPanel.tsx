import { CheckCircle2, CircleDollarSign, CreditCard } from "lucide-react";
import { Tile } from "./shared";

export function BillingPanel({ totalBusinesses, activeBusinesses }: { totalBusinesses: number; activeBusinesses: number }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Billing & Plans</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Tile title="Total MRR" value="P 48,000" sub="Platform recurring revenue" icon={CircleDollarSign} />
        <Tile title="Paying Businesses" value={`${activeBusinesses}/${totalBusinesses}`} sub="Currently active subscriptions" icon={CreditCard} />
        <Tile title="Trials" value={String(Math.max(0, totalBusinesses - activeBusinesses))} sub="Pending conversions" icon={CheckCircle2} />
      </div>
    </div>
  );
}
