import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import EmptyState from "@/components/EmptyState";
import { getEarnings } from "@/lib/order-fns";
import { ORDER_FLOW } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authed/earnings")({
  head: () => ({ meta: [{ title: "Earnings — SKILLFLIP" }] }),
  component: EarningsPage,
});

const monthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" });
};

function EarningsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState({ earned: 0, pending: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);

  // The ledger and its totals come from the server, which reads this seller's
  // orders itself — the browser never counts its own earnings.
  useEffect(() => {
    let alive = true;
    getEarnings({ data: {} })
      .then((result) => {
        if (!alive) return;
        setOrders(result.orders ?? []);
        setTotals({
          earned: result.earned ?? 0,
          pending: result.pending ?? 0,
          completedCount: result.completedCount ?? 0,
        });
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const { earned, pending, completedCount } = totals;

  const monthly = orders
    .filter((order) => order.status === "completed")
    .reduce((acc, order) => {
      const key = monthKey(order.created_date);
      acc[key] = (acc[key] || 0) + (order.price || 0);
      return acc;
    }, {});
  const chartData = Object.entries(monthly).map(([month, total]) => ({ month, total }));

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Adding up your earnings…</div>;
  }

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold md:text-[32px]">Earnings</h1>
        <p className="text-sm text-muted-foreground">What your skills have brought in so far.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 rounded-[24px] bg-foreground p-4 text-background sm:col-span-1 sm:rounded-[26px] sm:p-5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-background/60">
            <ArrowDownLeft className="h-3.5 w-3.5" /> Earned
          </span>
          <p className="mt-3 font-display text-[26px] font-extrabold leading-none sm:text-[30px]">{formatINR(earned)}</p>
        </div>
        <div className="rounded-[24px] border border-border/80 bg-card p-4 sm:rounded-[26px] sm:p-5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" /> In progress
          </span>
          <p className="mt-3 font-display text-[26px] font-extrabold leading-none sm:text-[30px]">{formatINR(pending)}</p>
        </div>
        <div className="rounded-[24px] border border-border/80 bg-accent/30 p-4 sm:rounded-[26px] sm:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">Gigs completed</span>
          <p className="mt-3 font-display text-[26px] font-extrabold leading-none sm:text-[30px]">{completedCount}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <section className="rounded-[26px] border border-border/80 bg-card p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">Earned by month</h2>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8B8494" }} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: 16, border: "1px solid #E6E2EA", fontSize: 12 }}
                  formatter={(value) => formatINR(value)}
                />
                <Bar dataKey="total" radius={[10, 10, 4, 4]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">History</h2>
        {orders.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nothing here yet"
            description="Once someone books a skill from you, every gig and payment shows up here."
            action={
              <Link to="/new-service" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                Offer a skill
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-border/80 bg-card">
            {orders.map((order, index) => {
              const status = ORDER_FLOW[order.status] ?? ORDER_FLOW.requested;
              return (
                <div
                  key={order.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 ${index > 0 ? "border-t border-border/70" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{order.service_title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {order.buyer_name} · {formatDate(order.created_date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] sm:inline ${status.tone}`}>
                      {status.label}
                    </span>
                    <span className="font-display text-sm font-bold">{formatINR(order.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        SKILLFLIP doesn't hold your money. You and your buyer settle payments directly — the ledger above is your
        record of the work.
      </p>
    </div>
  );
}