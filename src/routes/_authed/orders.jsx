import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import EmptyState from "@/components/EmptyState";
import OrderCard from "@/components/orders/OrderCard";
import { startConversation } from "@/lib/skillflip";

export const Route = createFileRoute("/_authed/orders")({
  head: () => ({ meta: [{ title: "My orders — SKILLFLIP" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const result = await base44.entities.Order.list({ sort: "-created_date", limit: 100 });
    setOrders(Array.isArray(result) ? result : result?.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const update = async (id, status) => {
    setBusy(true);
    try {
      await base44.entities.Order.update(id, { status });
      await load();
      toast.success(status === "completed" ? "Order completed" : "Order updated");
    } catch {
      toast.error("Couldn't update this order.");
    } finally {
      setBusy(false);
    }
  };

  const message = async (order) => {
    const isSeller = order.seller_id === user?.id;
    const otherId = isSeller ? order.buyer_id : order.seller_id;
    const id = await startConversation({
      me: user,
      other: {
        id: otherId,
        name: isSeller ? order.buyer_name : order.seller_name,
        username: isSeller ? order.buyer_username : order.seller_username,
        avatar: "",
      },
      contextTitle: order.service_title,
    });
    if (id) navigate({ to: "/messages", search: { c: id } });
  };

  const buying = orders.filter((order) => order.buyer_id === user?.id);
  const selling = orders.filter((order) => order.seller_id === user?.id);

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading your orders…</div>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold md:text-[32px]">My orders</h1>
        <p className="text-sm text-muted-foreground">Everything you've requested, and everything you're delivering.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">You're buying</h2>
        {buying.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No requests yet"
            description="Found a creation you love? Tap “I can make this for you” and send a request."
            action={
              <Link to="/skills" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                Find a skill
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {buying.map((order) => (
              <OrderCard key={order.id} order={order} role="buyer" busy={busy} onUpdate={update} onMessage={message} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">You're delivering</h2>
        {selling.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No gigs in progress"
            description="List a skill or attach one to a creation to start getting requests."
            action={
              <Link to="/new-service" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                Offer a skill
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {selling.map((order) => (
              <OrderCard key={order.id} order={order} role="seller" busy={busy} onUpdate={update} onMessage={message} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}