import { base44 } from "@/api/base44Client";

// Public showcase media and avatars — guests must be able to see the feed.
export async function uploadMedia(file) {
  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
  return file_url;
}

const slugify = (value) =>
  (value || "creator")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 18) || "creator";

export async function ensureProfile(user) {
  if (!user?.id) return null;
  const page = await base44.entities.Profile.filter({ user_id: user.id }, { limit: 1 });
  const existing = page?.items?.[0];
  if (existing) return existing;

  const base = slugify(user.full_name || user.email?.split("@")[0]);
  const username = `${base}${Math.random().toString(36).slice(2, 5)}`;
  return base44.entities.Profile.create({
    user_id: user.id,
    username,
    display_name: user.full_name || username,
    bio: "",
    skills: [],
    interests: [],
  });
}

export async function startConversation({ me, other, contextTitle, requestId }) {
  if (!me?.id || !other?.id) return null;
  if (me.id === other.id) return null;

  const existing = await base44.entities.Conversation.filter(
    { participant_ids: { $in: [other.id] } },
    { limit: 20 },
  );
  const already = (existing?.items ?? []).find(
    (conversation) =>
      Array.isArray(conversation.participant_ids) &&
      conversation.participant_ids.includes(me.id) &&
      conversation.participant_ids.includes(other.id) &&
      // A task keeps its own thread, so a second task with the same person stays separate.
      (requestId ? conversation.request_id === requestId : !conversation.request_id),
  );
  if (already) return already.id;

  const profile = await base44.entities.Profile.filter({ user_id: me.id }, { limit: 1 });
  const myProfile = profile?.items?.[0];
  const meName = myProfile?.display_name || me.full_name || "Me";
  const meUsername = myProfile?.username || "";

  const conversation = await base44.entities.Conversation.create({
    participant_ids: [me.id, other.id],
    user_a_id: me.id,
    user_a_name: meName,
    user_a_username: meUsername,
    user_a_avatar: myProfile?.avatar_url || "",
    user_b_id: other.id,
    user_b_name: other.name || "Creator",
    user_b_username: other.username || "",
    user_b_avatar: other.avatar || "",
    context_title: contextTitle || "",
    request_id: requestId || "",
    last_message: "",
    last_message_at: new Date().toISOString(),
  });
  return conversation.id;
}

// Chat attachments are private: only the two people in the thread can open them.
export async function uploadChatFile(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}

export async function sendMessage({ conversation, me, body, attachment }) {
  const otherId = conversation.user_a_id === me.id ? conversation.user_b_id : conversation.user_a_id;
  await base44.entities.Message.create({
    conversation_id: conversation.id,
    sender_id: me.id,
    sender_name: me.full_name || "Me",
    recipient_id: otherId,
    body: body || "",
    ...(attachment ? { attachment } : {}),
  });
  await base44.entities.Conversation.update(conversation.id, {
    last_message: body || (attachment ? `📎 ${attachment.file_name}` : ""),
    last_message_at: new Date().toISOString(),
  });
}