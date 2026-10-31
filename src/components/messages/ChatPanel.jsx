import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/Avatar";
import AttachmentView from "@/components/messages/AttachmentView";
import Composer from "@/components/messages/Composer";
import ProposalCard from "@/components/messages/ProposalCard";
import ProposalDialog from "@/components/messages/ProposalDialog";
import { otherParticipant } from "@/components/messages/ThreadList";
import { acceptProposal, rejectProposal } from "@/lib/proposal-fns";
import { formatTime } from "@/lib/format";
import { sendMessage, uploadChatFile } from "@/lib/skillflip";
import { cn } from "@/lib/utils";

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export default function ChatPanel({ conversation, me, onBack, onSent }) {
  const [messages, setMessages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [task, setTask] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [busyProposal, setBusyProposal] = useState(false);
  const bottomRef = useRef(null);
  const other = otherParticipant(conversation, me);

  const loadProposals = () =>
    base44.entities.Proposal.filter({ conversation_id: conversation.id }, { sort: "created_date", limit: 50 })
      .then((page) => setProposals(page?.items ?? []));

  useEffect(() => {
    let alive = true;
    setMessages([]);
    setProposals([]);

    base44.entities.Message.filter(
      { conversation_id: conversation.id },
      { sort: "created_date", limit: 200 },
    ).then((page) => {
      if (alive) setMessages(page?.items ?? []);
    });
    loadProposals();

    const unsubscribeMessages = base44.entities.Message.subscribe((event) => {
      if (event?.data?.conversation_id !== conversation.id || event.type !== "create") return;
      setMessages((prev) => (prev.some((item) => item.id === event.data.id) ? prev : [...prev, event.data]));
    });

    const unsubscribeProposals = base44.entities.Proposal.subscribe((event) => {
      if (event?.data?.conversation_id !== conversation.id) return;
      loadProposals();
    });

    return () => {
      alive = false;
      unsubscribeMessages?.();
      unsubscribeProposals?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    setTask(null);
    if (!conversation.request_id) return;
    let alive = true;
    base44.entities.SkillRequest.get(conversation.request_id)
      .then((record) => {
        if (alive) setTask(record);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [conversation.request_id]);

  const timeline = useMemo(
    () =>
      [
        ...messages.map((message) => ({ kind: "message", at: message.created_date, data: message })),
        ...proposals.map((proposal) => ({ kind: "proposal", at: proposal.created_date, data: proposal })),
      ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [messages, proposals],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [timeline.length]);

  const canPropose =
    Boolean(task?.author_id) &&
    Boolean(me?.id) &&
    task.author_id !== me.id &&
    !proposals.some((proposal) => proposal.status === "accepted");

  const submit = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage({ conversation, me, body });
      onSent?.();
    } finally {
      setSending(false);
    }
  };

  const attach = async (file) => {
    if (uploading) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Images and PDFs only, please.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Keep attachments under 8 MB.");
      return;
    }

    setUploading(true);
    try {
      const file_uri = await uploadChatFile(file);
      await sendMessage({
        conversation,
        me,
        body: "",
        attachment: {
          file_uri,
          file_name: file.name,
          content_type: file.type,
          kind: isPdf ? "pdf" : "image",
          size: file.size,
        },
      });
      onSent?.();
    } catch {
      toast.error("Couldn't upload that file.");
    } finally {
      setUploading(false);
    }
  };

  const accept = async (proposal) => {
    setBusyProposal(true);
    try {
      await acceptProposal({ data: { proposalId: proposal.id } });
      await loadProposals();
      toast.success("Proposal accepted — order created");
    } catch (error) {
      toast.error(error?.status === 403 ? "Only the task owner can accept a proposal." : "Couldn't accept that proposal.");
    } finally {
      setBusyProposal(false);
    }
  };

  const decline = async (proposal) => {
    setBusyProposal(true);
    try {
      await rejectProposal({ data: { proposalId: proposal.id } });
      await loadProposals();
      toast("Proposal declined");
    } catch (error) {
      toast.error(error?.status === 403 ? "Only the task owner can decline a proposal." : "Couldn't decline that proposal.");
    } finally {
      setBusyProposal(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-15rem)] flex-col md:h-[68vh]">
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-secondary md:h-8 md:w-8">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Avatar name={other.name} src={other.avatar} size="sm" />
        <div className="min-w-0">
          {other.username ? (
            <Link
              to="/u/$username"
              params={{ username: other.username }}
              className="block truncate text-[14px] font-semibold hover:underline"
            >
              {other.name}
            </Link>
          ) : (
            <p className="truncate text-[14px] font-semibold">{other.name}</p>
          )}
          <p className="truncate text-[11px] text-muted-foreground">
            {conversation.context_title || "Direct message"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {timeline.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            This is the start of something. Say what you need, share a reference, agree on a price.
          </p>
        )}

        {timeline.map((item) => {
          if (item.kind === "proposal") {
            return (
              <div key={`proposal-${item.data.id}`} className="flex justify-start">
                <div className="w-full max-w-sm">
                  <ProposalCard
                    proposal={item.data}
                    me={me}
                    busy={busyProposal}
                    onAccept={accept}
                    onReject={decline}
                  />
                  <p className="mt-1 pl-1 text-[10px] text-muted-foreground">{formatTime(item.data.created_date)}</p>
                </div>
              </div>
            );
          }

          const mine = item.data.sender_id === me.id;
          const attachment = item.data.attachment;
          return (
            <div key={item.data.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-[20px] px-3.5 py-2.5 text-[13px] leading-relaxed",
                  mine ? "bg-foreground text-background" : "bg-secondary text-foreground",
                )}
              >
                {attachment?.file_uri && (
                  <div className={item.data.body ? "mb-2" : ""}>
                    <AttachmentView messageId={item.data.id} attachment={attachment} mine={mine} />
                  </div>
                )}
                {item.data.body && <p className="whitespace-pre-line">{item.data.body}</p>}
                <p className={cn("mt-1 text-[10px]", mine ? "text-background/50" : "text-muted-foreground")}>
                  {formatTime(item.data.created_date)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <Composer
        draft={draft}
        onDraft={setDraft}
        onSubmit={submit}
        onFile={attach}
        uploading={uploading}
        sending={sending}
        canPropose={canPropose}
        onPropose={() => setProposalOpen(true)}
        placeholder={`Message ${other.name?.split(" ")[0] || "creator"}…`}
      />

      <ProposalDialog
        conversation={conversation}
        taskTitle={task?.title || conversation.context_title}
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        onDone={loadProposals}
      />
    </div>
  );
}