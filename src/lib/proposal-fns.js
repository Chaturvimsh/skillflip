import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

/**
 * Task proposals: a creator offers a price and a delivery time in the thread
 * that belongs to a task, and only the person who posted the task can accept it.
 * Accepting creates a normal Order (status "in_progress" — no payment happens
 * anywhere in SKILLFLIP yet), so delivery, revisions and approval keep running
 * through the existing My Orders workflow.
 */

const fail = (status, message) => Object.assign(new Error(message), { status });

const loadOr404 = async (context, entity, id, message) => {
  const record = await context
    .getBase44()
    .entities[entity].get(id)
    .catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
  if (!record) throw fail(404, message);
  return record;
};

const participantSide = (conversation, userId) =>
  conversation.user_a_id === userId
    ? { name: conversation.user_a_name, username: conversation.user_a_username }
    : { name: conversation.user_b_name, username: conversation.user_b_username };

const touchConversation = (context, conversationId, text) =>
  context.getBase44().entities.Conversation.update(conversationId, {
    last_message: text,
    last_message_at: new Date().toISOString(),
  });

const dueDateIn = (days) => new Date(Date.now() + Math.max(1, Number(days) || 3) * 86400000).toISOString().slice(0, 10);

export const createProposal = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      conversationId: z.string().min(1),
      price: z.number().min(1).max(1000000),
      deliveryDays: z.number().int().min(1).max(120),
      description: z.string().trim().min(10).max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const conversation = await loadOr404(context, "Conversation", data.conversationId, "Conversation not found");

    if (!conversation.request_id) throw fail(409, "This conversation is not linked to a task");
    if (!(conversation.participant_ids ?? []).includes(context.user.id)) {
      throw fail(403, "You are not part of this conversation");
    }

    const request = await loadOr404(context, "SkillRequest", conversation.request_id, "This task is no longer available");
    if (request.author_id === context.user.id) throw fail(403, "Only the person who posted the task can receive proposals");

    const pending = await base.entities.Proposal.filter(
      { conversation_id: conversation.id, creator_id: context.user.id, status: "pending" },
      { limit: 1 },
    );
    if ((pending?.items ?? []).length) throw fail(409, "You already have a proposal waiting for a reply");

    const me = participantSide(conversation, context.user.id);

    const proposal = await base.entities.Proposal.create({
      conversation_id: conversation.id,
      request_id: request.id,
      buyer_id: request.author_id,
      buyer_name: request.author_name || participantSide(conversation, request.author_id).name || "",
      creator_id: context.user.id,
      creator_name: me.name || "",
      price: data.price,
      delivery_days: data.deliveryDays,
      description: data.description,
      status: "pending",
    });

    await touchConversation(context, conversation.id, `Proposal sent · ₹${data.price}`).catch(() => {});

    return proposal;
  });

export const acceptProposal = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ proposalId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const proposal = await loadOr404(context, "Proposal", data.proposalId, "Proposal not found");

    if (proposal.buyer_id !== context.user.id) {
      throw fail(403, "Only the person who posted the task can accept this proposal");
    }
    // Repeated clicks land here: the order already exists, hand back the same one.
    if (proposal.order_id) return { orderId: proposal.order_id, alreadyAccepted: true };
    if (proposal.status !== "pending") throw fail(409, "This proposal is already closed");

    const existing = await base.entities.Order.filter({ proposal_id: proposal.id }, { limit: 1 });
    const existingOrder = existing?.items?.[0];
    if (existingOrder) {
      await base.entities.Proposal.update(proposal.id, { status: "accepted", order_id: existingOrder.id });
      return { orderId: existingOrder.id, alreadyAccepted: true };
    }

    const request = await loadOr404(context, "SkillRequest", proposal.request_id, "This task is no longer available");
    const conversation = await loadOr404(context, "Conversation", proposal.conversation_id, "Conversation not found");
    const creator = participantSide(conversation, proposal.creator_id);

    const order = await base.entities.Order.create({
      service_title: request.title,
      service_image: "",
      request_id: request.id,
      proposal_id: proposal.id,
      buyer_id: proposal.buyer_id,
      buyer_name: proposal.buyer_name || request.author_name || "Buyer",
      buyer_username: request.author_username || "",
      seller_id: proposal.creator_id,
      seller_name: creator.name || proposal.creator_name || "Creator",
      seller_username: creator.username || "",
      price: proposal.price,
      due_date: dueDateIn(proposal.delivery_days),
      notes: proposal.description,
      status: "in_progress",
    });

    // Two clicks in flight can both pass the check above; keep the first order only.
    const created = await base.asServiceRole.entities.Order.filter({ proposal_id: proposal.id }, { sort: "created_date", limit: 5 });
    const all = created?.items ?? [];
    const keeper = all[0] ?? order;
    if (all.length > 1) {
      await base.asServiceRole.entities.Order.deleteMany({ proposal_id: proposal.id, id: { $ne: keeper.id } });
    }

    await base.entities.Proposal.update(proposal.id, { status: "accepted", order_id: keeper.id });
    await touchConversation(context, proposal.conversation_id, `Proposal accepted · ${request.title}`).catch(() => {});

    return { orderId: keeper.id, alreadyAccepted: keeper.id !== order.id };
  });

export const rejectProposal = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ proposalId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const proposal = await loadOr404(context, "Proposal", data.proposalId, "Proposal not found");

    if (proposal.buyer_id !== context.user.id) {
      throw fail(403, "Only the person who posted the task can reject this proposal");
    }
    if (proposal.status !== "pending" || proposal.order_id) throw fail(409, "This proposal is already closed");

    await base.entities.Proposal.update(proposal.id, { status: "rejected" });
    await touchConversation(context, proposal.conversation_id, "Proposal declined").catch(() => {});

    return { id: proposal.id, status: "rejected" };
  });