import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

/**
 * Chat attachments live in private storage, so nothing is readable from a URL
 * alone. Opening one asks the server for a short-lived link, and the server only
 * signs it for a participant of the conversation the file was posted in.
 */
export const getAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ messageId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const base = context.getBase44();
    const message = await base.entities.Message.get(data.messageId).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });
    if (!message.attachment?.file_uri) throw Object.assign(new Error("This message has no attachment"), { status: 404 });

    const conversation = await base.entities.Conversation.get(message.conversation_id).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
    if (!conversation || !(conversation.participant_ids ?? []).includes(context.user.id)) {
      throw Object.assign(new Error("You cannot open this file"), { status: 403 });
    }

    const { signed_url } = await base.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: message.attachment.file_uri,
      expires_in: 600,
    });

    return { signed_url };
  });