import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

/**
 * Order delivery is the only part of an order both sides change on purpose:
 * the seller hands work over, the buyer approves it or asks for changes. Every
 * one of these runs on the server and re-checks who is calling, because the
 * order's own access rules let either party edit it.
 */

const DeliverableInput = z.object({
  file_uri: z.string().min(1).max(600),
  file_name: z.string().min(1).max(120),
  content_type: z.string().max(120).optional(),
});

const fail = (status, message) => Object.assign(new Error(message), { status });

// Read through the caller's client: the order's read rules mean anyone who is
// not its buyer, seller or an admin simply cannot see it.
const loadOrder = async (context, orderId) => {
  const order = await context
    .getBase44()
    .entities.Order.get(orderId)
    .catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
  if (!order) throw fail(404, "Order not found");
  return order;
};

export const submitDelivery = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      orderId: z.string().min(1),
      deliverables: z.array(DeliverableInput).max(5).optional(),
      message: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const order = await loadOrder(context, data.orderId);
    if (order.seller_id !== context.user.id) throw fail(403, "Only the seller can deliver this order");
    if (!["in_progress", "delivered"].includes(order.status)) {
      throw fail(409, "This order is not open for delivery");
    }

    const now = new Date().toISOString();
    const message = (data.message ?? "").trim();
    const incoming = (data.deliverables ?? []).map((file) => ({
      ...file,
      content_type: file.content_type ?? "",
      uploaded_at: now,
      uploaded_by: context.user.id,
    }));
    const deliverables = incoming.length ? incoming : order.deliverables ?? [];

    if (!deliverables.length && !message) throw fail(400, "Attach a file or write a delivery message");

    await context.getBase44().entities.Order.update(order.id, {
      deliverables,
      delivery_message: message,
      delivered_at: now,
      revision_note: "",
      status: "delivered",
    });

    return { id: order.id, status: "delivered", delivered_at: now };
  });

export const approveDelivery = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ orderId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const order = await loadOrder(context, data.orderId);
    if (order.buyer_id !== context.user.id) throw fail(403, "Only the buyer can approve this order");
    if (order.status !== "delivered") throw fail(409, "There is no delivery to approve");

    const now = new Date().toISOString();
    await context.getBase44().entities.Order.update(order.id, {
      status: "completed",
      approved_at: now,
      revision_note: "",
    });

    return { id: order.id, status: "completed", approved_at: now };
  });

export const requestRevision = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ orderId: z.string().min(1), note: z.string().max(500).optional() }))
  .handler(async ({ data, context }) => {
    const order = await loadOrder(context, data.orderId);
    if (order.buyer_id !== context.user.id) throw fail(403, "Only the buyer can request changes");
    if (order.status !== "delivered") throw fail(409, "There is no delivery to revise");

    const now = new Date().toISOString();
    await context.getBase44().entities.Order.update(order.id, {
      status: "in_progress",
      revision_note: (data.note ?? "").trim(),
      revision_requested_at: now,
    });

    return { id: order.id, status: "in_progress" };
  });

// Deliverable files live in private storage: the file only opens for someone
// who can already see the order, and only for a file that order actually holds.
export const getDeliverableUrl = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ orderId: z.string().min(1), fileUri: z.string().min(1).max(600) }))
  .handler(async ({ data, context }) => {
    const order = await loadOrder(context, data.orderId);
    const owned = (order.deliverables ?? []).some((file) => file.file_uri === data.fileUri);
    if (!owned) throw fail(403, "That file does not belong to this order");

    const { signed_url } = await context
      .getBase44()
      .asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: data.fileUri, expires_in: 600 });

    return { signed_url };
  });