import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

/**
 * Every order mutation lives here and runs on the server. The Order entity's own
 * access rules let only admins create, update or delete a record, so these
 * handlers — which check the caller, the side they are on and the current status,
 * then write with the service role — are the only way an order can change.
 * Price, buyer and seller are fixed at creation and no handler accepts them.
 */

const DeliverableInput = z.object({
  file_uri: z.string().min(1).max(600),
  file_name: z.string().min(1).max(120),
  content_type: z.string().max(120).optional(),
});

const OPEN_STATUSES = ["requested", "in_progress", "delivered"];

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

const saveOrder = (context, orderId, patch) =>
  context.getBase44().asServiceRole.entities.Order.update(orderId, patch);

const buyerProfile = async (base, userId) => {
  const page = await base.entities.Profile.filter({ user_id: userId }, { limit: 1 });
  return page?.items?.[0] ?? null;
};

const dueDateIn = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

// A request against a listed skill. Everything money- or identity-shaped is read
// from the service record, never from the caller.
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      serviceId: z.string().min(1).max(120),
      notes: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const service = await base.entities.Service.get(data.serviceId).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!service || service.active === false) throw fail(404, "This skill is no longer available");
    if (!service.creator_id) throw fail(409, "This skill isn't bookable right now");
    if (service.creator_id === context.user.id) throw fail(400, "This is your own skill");

    const price = Number(service.price);
    if (!Number.isFinite(price) || price <= 0) throw fail(409, "This skill has no valid price");

    const open = await base.asServiceRole.entities.Order.filter(
      { buyer_id: context.user.id, service_id: service.id, status: { $in: OPEN_STATUSES } },
      { limit: 1 },
    );
    if ((open?.items ?? []).length) throw fail(409, "You already have an open request for this skill");

    const profile = await buyerProfile(base, context.user.id);
    const days = Math.min(Math.max(Math.round(Number(service.delivery_days) || 3), 1), 120);

    const order = await base.asServiceRole.entities.Order.create({
      service_id: service.id,
      service_title: service.title,
      service_image: service.image_url || "",
      buyer_id: context.user.id,
      buyer_name: profile?.display_name || context.user.full_name || "Buyer",
      buyer_username: profile?.username || "",
      seller_id: service.creator_id,
      seller_name: service.creator_name || "Creator",
      seller_username: service.creator_username || "",
      price,
      due_date: dueDateIn(days),
      notes: (data.notes ?? "").trim(),
      status: "requested",
      deliverables: [],
    });

    return order;
  });

// The three answers a request can get while it is still "requested".
const STATUS_ACTIONS = {
  accept: {
    side: "seller",
    from: ["requested"],
    to: "in_progress",
    denied: "Only the seller can accept this request",
    stale: "This request has already been answered",
  },
  decline: {
    side: "seller",
    from: ["requested"],
    to: "declined",
    denied: "Only the seller can decline this request",
    stale: "This request has already been answered",
  },
  cancel: {
    side: "buyer",
    from: ["requested"],
    to: "declined",
    denied: "Only the buyer can cancel this request",
    stale: "This request can no longer be cancelled",
  },
};

export const changeOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ orderId: z.string().min(1), action: z.enum(["accept", "decline", "cancel"]) }))
  .handler(async ({ data, context }) => {
    const rule = STATUS_ACTIONS[data.action];
    const order = await loadOrder(context, data.orderId);

    if (order[`${rule.side}_id`] !== context.user.id) throw fail(403, rule.denied);
    if (!rule.from.includes(order.status)) throw fail(409, rule.stale);

    await saveOrder(context, order.id, { status: rule.to });
    return { id: order.id, status: rule.to };
  });

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

    await saveOrder(context, order.id, {
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

    const submitted = (order.deliverables ?? []).length > 0 || (order.delivery_message ?? "").trim().length > 0;
    if (!submitted) throw fail(409, "There is no delivery to approve");

    const now = new Date().toISOString();
    await saveOrder(context, order.id, {
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
    await saveOrder(context, order.id, {
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

// The earnings ledger, totalled from the orders themselves as the signed-in
// seller — the browser never adds up its own numbers.
export const getEarnings = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({}))
  .handler(async ({ context }) => {
    const page = await context
      .getBase44()
      .asServiceRole.entities.Order.filter({ seller_id: context.user.id }, { sort: "-created_date", limit: 200 });
    const orders = page?.items ?? [];
    const total = (list) => list.reduce((sum, order) => sum + Number(order.price || 0), 0);
    const completed = orders.filter((order) => order.status === "completed");

    return {
      orders,
      earned: total(completed),
      pending: total(orders.filter((order) => OPEN_STATUSES.includes(order.status))),
      completedCount: completed.length,
    };
  });