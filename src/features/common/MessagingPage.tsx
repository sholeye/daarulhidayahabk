import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiMoreVertical,
  FiCornerUpLeft,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiImage,
  FiMessageCircle,
  FiPaperclip,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/features/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { UserRole } from "@/types";

type MessageContact = {
  user_id: string;
  display_name: string;
  contact_role: UserRole;
  email: string;
  avatar_url: string | null;
};
type Conversation = {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
};
type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
  reply_to_id: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  deleted_at: string | null;
  deleted_by: string | null;
};
type ConversationSetting = {
  conversation_id: string;
  hidden_at: string | null;
  blocked_at: string | null;
};

type MessageDraftFile = { file: File; preview?: string };
type PointerStart = { x: number; y: number; messageId: string };
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  instructor: "Instructor",
  learner: "Student",
  parent: "Parent",
};

const contactCategories: Array<{
  id: "all" | "learner" | "instructor" | "admin";
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "learner", label: "Students" },
  { id: "instructor", label: "Instructors" },
  { id: "admin", label: "Admins" },
];

export const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationSettings, setConversationSettings] = useState<
    Record<string, ConversationSetting>
  >({});
  const [latestMessages, setLatestMessages] = useState<
    Record<string, ChatMessage>
  >({});
  const [unreadByConversation, setUnreadByConversation] = useState<
    Record<string, number>
  >({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState(
    searchParams.get("conversation") || "",
  );
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState<
    "all" | "learner" | "instructor" | "admin"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeenById, setLastSeenById] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [attachment, setAttachment] = useState<MessageDraftFile | null>(null);
  const [pointerStart, setPointerStart] = useState<PointerStart | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ChatMessage | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [viewingImage, setViewingImage] = useState<{
    path: string;
    url: string;
    name: string;
  } | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(
    null,
  );
  const [openConversationMenuId, setOpenConversationMenuId] = useState<
    string | null
  >(null);
  const [profileContact, setProfileContact] = useState<MessageContact | null>(
    null,
  );

  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.user_id, contact])),
    [contacts],
  );
  const activeConversation = conversations.find(
    (item) => item.id === activeConversationId,
  );
  const otherUserId = activeConversation
    ? activeConversation.participant_one === user?.id
      ? activeConversation.participant_two
      : activeConversation.participant_one
    : "";
  const activeContact = contactById.get(otherUserId);
  const activeSettings = activeConversationId
    ? conversationSettings[activeConversationId]
    : undefined;
  const isBlockedByMe = Boolean(activeSettings?.blocked_at);
  const visibleConversations = conversations.filter(
    (conversation) => !conversationSettings[conversation.id]?.hidden_at,
  );
  const visibleContacts = contacts.filter(
    (contact) =>
      (contactCategory === "all" || contact.contact_role === contactCategory) &&
      contact.display_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const loadInbox = useCallback(async () => {
    if (!user?.id) return;
    const [contactsResult, conversationsResult] = await Promise.all([
      supabase.rpc("get_message_contacts"),
      supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);
    if (contactsResult.error || conversationsResult.error) {
      toast.error(
        contactsResult.error?.message ||
          conversationsResult.error?.message ||
          "Unable to load inbox.",
      );
      setIsLoading(false);
      return;
    }
    setContacts((contactsResult.data || []) as MessageContact[]);
    const fetchedConversations = (conversationsResult.data ||
      []) as Conversation[];
    setConversations(fetchedConversations);
    if (fetchedConversations.length) {
      const conversationIds = fetchedConversations.map(
        (conversation) => conversation.id,
      );
      const [{ data: settings }, { data: rows, error: messagesError }] =
        await Promise.all([
          supabase
            .from("conversation_user_settings")
            .select("conversation_id, hidden_at, blocked_at")
            .eq("user_id", user.id)
            .in("conversation_id", conversationIds),
          supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, body, created_at, read_at, edited_at, reply_to_id, attachment_path, attachment_name, attachment_type, attachment_size, deleted_at, deleted_by",
            )
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false }),
        ]);
      setConversationSettings(
        Object.fromEntries(
          (settings || []).map((setting) => [
            setting.conversation_id,
            setting as ConversationSetting,
          ]),
        ),
      );
      if (messagesError) {
        toast.error(
          messagesError.message || "Unable to load conversation previews.",
        );
      } else {
        const latest: Record<string, ChatMessage> = {};
        const unread: Record<string, number> = {};
        for (const row of (rows || []) as ChatMessage[]) {
          if (!latest[row.conversation_id]) latest[row.conversation_id] = row;
          if (row.sender_id !== user.id && !row.read_at && !row.deleted_at) {
            unread[row.conversation_id] =
              (unread[row.conversation_id] || 0) + 1;
          }
        }
        setLatestMessages(latest);
        setUnreadByConversation(unread);
      }
    } else {
      setConversationSettings({});
      setLatestMessages({});
      setUnreadByConversation({});
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    const channel = supabase
      .channel("conversation-list-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => void loadInbox(),
      )
      .subscribe();
    const refresh = window.setInterval(loadInbox, 15000);
    return () => {
      window.clearInterval(refresh);
      void supabase.removeChannel(channel);
    };
  }, [loadInbox]);

  useEffect(() => {
    const requestedConversation = searchParams.get("conversation");
    if (
      requestedConversation &&
      conversations.some((item) => item.id === requestedConversation)
    ) {
      setActiveConversationId(requestedConversation);
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    const contactIds = contacts.map((contact) => contact.user_id);
    if (!contactIds.length) {
      setLastSeenById({});
      return;
    }
    let isCurrent = true;
    const loadLastSeen = async () => {
      const { data } = await supabase
        .from("message_presence")
        .select("user_id, last_seen_at")
        .in("user_id", contactIds);
      if (isCurrent && data) {
        setLastSeenById(
          Object.fromEntries(
            data.map((presence) => [presence.user_id, presence.last_seen_at]),
          ),
        );
      }
    };
    void loadLastSeen();
    const refresh = window.setInterval(loadLastSeen, 60000);
    return () => {
      isCurrent = false;
      window.clearInterval(refresh);
    };
  }, [contacts]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let isCurrent = true;
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, body, created_at, read_at, edited_at, reply_to_id, attachment_path, attachment_name, attachment_type, attachment_size, deleted_at, deleted_by",
        )
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true });
      if (!isCurrent) return;
      if (error) {
        toast.error(error.message || "Unable to load messages.");
        return;
      }
      const loadedMessages = (data || []) as ChatMessage[];
      setMessages(loadedMessages);
      const unreadIds = loadedMessages
        .filter(
          (message) =>
            message.sender_id !== user?.id &&
            !message.read_at &&
            !message.deleted_at,
        )
        .map((message) => message.id);
      if (unreadIds.length > 0) {
        const readAt = new Date().toISOString();
        const { error: readError } = await supabase
          .from("messages")
          .update({ read_at: readAt })
          .in("id", unreadIds);
        if (!readError && isCurrent) {
          setMessages((previous) =>
            previous.map((message) =>
              unreadIds.includes(message.id)
                ? { ...message, read_at: readAt }
                : message,
            ),
          );
        }
      }
    };
    void loadMessages();
    const refreshTimer = window.setInterval(loadMessages, 5000);
    const channel = supabase
      .channel(`messages-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          void loadMessages();
          void loadInbox();
        },
      )
      .subscribe();
    return () => {
      isCurrent = false;
      window.clearInterval(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [activeConversationId, loadInbox, user?.id]);

  useEffect(() => {
    let isCurrent = true;
    const imageMessages = messages.filter(
      (message) =>
        !message.deleted_at &&
        message.attachment_path &&
        message.attachment_type?.startsWith("image/"),
    );
    void Promise.all(
      imageMessages.map(async (message) => {
        const { data } = await supabase.storage
          .from("message-files")
          .createSignedUrl(message.attachment_path!, 60 * 60);
        return data
          ? ([message.attachment_path!, data.signedUrl] as const)
          : null;
      }),
    ).then((previews) => {
      if (!isCurrent) return;
      setImageUrls(
        Object.fromEntries(
          previews.filter(
            (entry): entry is readonly [string, string] => entry !== null,
          ),
        ),
      );
    });
    return () => {
      isCurrent = false;
    };
  }, [messages]);

  useEffect(() => {
    if (!user?.id) {
      setOnlineUsers(new Set());
      return;
    }
    const channel = supabase.channel("school-messaging-presence", {
      config: { presence: { key: user.id } },
    });
    const syncPresence = () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{ user_id?: string }>
      >;
      const userIds = new Set(
        Object.values(state).flatMap((entries) =>
          entries
            .map((entry) => entry.user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      setOnlineUsers(userIds);
    };
    const saveLastSeen = async () => {
      const { error } = await supabase
        .from("message_presence")
        .upsert(
          { user_id: user.id, last_seen_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (error)
        console.warn(
          "Unable to update messaging last-seen status:",
          error.message,
        );
    };
    const syncVisibility = async () => {
      if (document.visibilityState === "visible") {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      } else {
        await channel.untrack();
      }
      void saveLastSeen();
    };
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") void saveLastSeen();
    }, 30000);
    document.addEventListener("visibilitychange", syncVisibility);
    channel
      .on("presence", { event: "sync" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await syncVisibility();
        }
      });
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      window.clearInterval(heartbeat);
      void saveLastSeen();
      void supabase.removeChannel(channel);
      setOnlineUsers(new Set());
    };
  }, [user?.id]);

  const openConversation = async (contact: MessageContact) => {
    if (!user?.id) return;
    const existing = conversations.find(
      (item) =>
        (item.participant_one === user.id &&
          item.participant_two === contact.user_id) ||
        (item.participant_two === user.id &&
          item.participant_one === contact.user_id),
    );
    if (existing) {
      setActiveConversationId(existing.id);
      setSearchParams({ conversation: existing.id });
      if (conversationSettings[existing.id]?.hidden_at) {
        void updateConversationSetting(existing, { hidden_at: null });
      }
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ participant_one: user.id, participant_two: contact.user_id })
      .select("*")
      .single();
    if (error) {
      await loadInbox();
      const { data: createdByOther } = await supabase
        .from("conversations")
        .select("*")
        .eq("participant_one", contact.user_id)
        .eq("participant_two", user.id)
        .maybeSingle();
      if (createdByOther) {
        const existingConversation = createdByOther as Conversation;
        setConversations((previous) => [
          existingConversation,
          ...previous.filter((item) => item.id !== existingConversation.id),
        ]);
        if (conversationSettings[existingConversation.id]?.hidden_at) {
          void updateConversationSetting(existingConversation, {
            hidden_at: null,
          });
        }
        setActiveConversationId(existingConversation.id);
        setSearchParams({ conversation: existingConversation.id });
      } else {
        toast.error(error.message || "Unable to start conversation.");
      }
      return;
    }
    const conversation = data as Conversation;
    setConversations((previous) => [conversation, ...previous]);
    setActiveConversationId(conversation.id);
    setSearchParams({ conversation: conversation.id });
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (isBlockedByMe) {
      toast.error("Unblock this conversation before sending a message.");
      return;
    }
    if (
      !user?.id ||
      !activeConversationId ||
      (!body && !attachment) ||
      isSending
    )
      return;
    setIsSending(true);
    try {
      if (editingMessage) {
        const { data: updatedMessage, error } = await supabase
          .from("messages")
          .update({ body })
          .eq("id", editingMessage.id)
          .eq("sender_id", user.id)
          .select("id, edited_at")
          .maybeSingle();
        if (error) throw error;
        if (!updatedMessage)
          throw new Error("Message was not updated. Refresh and try again.");
        setMessages((previous) =>
          previous.map((message) =>
            message.id === editingMessage.id
              ? { ...message, body, edited_at: new Date().toISOString() }
              : message,
          ),
        );
        setEditingMessage(null);
      } else {
        let attachmentPath: string | null = null;
        if (attachment) {
          const safeName = attachment.file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_",
          );
          attachmentPath = `${activeConversationId}/${user.id}/${crypto.randomUUID()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("message-files")
            .upload(attachmentPath, attachment.file, {
              contentType: attachment.file.type,
              upsert: false,
            });
          if (uploadError) throw uploadError;
        }
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversationId,
            sender_id: user.id,
            body,
            reply_to_id: replyTo?.id || null,
            attachment_path: attachmentPath,
            attachment_name: attachment?.file.name || null,
            attachment_type: attachment?.file.type || null,
            attachment_size: attachment?.file.size || null,
          })
          .select(
            "id, conversation_id, sender_id, body, created_at, read_at, edited_at, reply_to_id, attachment_path, attachment_name, attachment_type, attachment_size, deleted_at, deleted_by",
          )
          .single();
        if (error) {
          if (attachmentPath)
            await supabase.storage
              .from("message-files")
              .remove([attachmentPath]);
          throw error;
        }
        setMessages((previous) => [...previous, data as ChatMessage]);
        setReplyTo(null);
        clearAttachment();
      }
      setDraft("");
      void loadInbox();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Message could not be sent.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const clearAttachment = () => {
    setAttachment((current) => {
      if (current?.preview) URL.revokeObjectURL(current.preview);
      return null;
    });
  };

  const selectAttachment = (file?: File) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if ((!isImage && !ALLOWED_ATTACHMENT_TYPES.has(file.type)) || !file.type) {
      toast.error("Choose an image or document file.");
      return;
    }
    if (file.size >= MAX_ATTACHMENT_BYTES) {
      toast.error("Attachments must be smaller than 2 MB.");
      return;
    }
    clearAttachment();
    setAttachment({
      file,
      preview: isImage ? URL.createObjectURL(file) : undefined,
    });
  };

  const beginReply = (message: ChatMessage) => {
    setEditingMessage(null);
    setReplyTo(message);
    setDraft("");
  };

  const beginEdit = (message: ChatMessage) => {
    if (message.sender_id !== user?.id) return;
    setReplyTo(null);
    clearAttachment();
    setEditingMessage(message);
    setDraft(message.body);
  };

  const deleteMessage = async (message: ChatMessage) => {
    if (message.sender_id !== user?.id || !user?.id) return;
    const deletedAt = new Date().toISOString();
    const { data: deletedRecord, error } = await supabase
      .from("messages")
      .update({ deleted_at: deletedAt, deleted_by: user.id })
      .eq("id", message.id)
      .select("id, deleted_at, deleted_by")
      .maybeSingle();
    if (error) {
      toast.error(error.message || "Unable to delete message.");
      return;
    }
    if (!deletedRecord) {
      toast.error("Message was not deleted. Refresh and try again.");
      return;
    }
    if (message.attachment_path) {
      await supabase.storage
        .from("message-files")
        .remove([message.attachment_path]);
    }
    setMessages((previous) =>
      previous.map((item) =>
        item.id === message.id
          ? {
              ...item,
              body: "",
              attachment_path: null,
              attachment_name: null,
              attachment_type: null,
              attachment_size: null,
              deleted_at: deletedAt,
              deleted_by: user.id,
            }
          : item,
      ),
    );
    if (replyTo?.id === message.id) setReplyTo(null);
    setPendingDelete(null);
    toast.success("Message deleted.");
  };

  const openAttachment = async (message: ChatMessage) => {
    if (!message.attachment_path || message.deleted_at) return;
    const { data, error } = await supabase.storage
      .from("message-files")
      .createSignedUrl(message.attachment_path, 60 * 60);
    if (error) {
      toast.error(error.message || "Unable to open attachment.");
      return;
    }
    if (message.attachment_type?.startsWith("image/")) {
      setViewingImage({
        path: message.attachment_path,
        url: data.signedUrl,
        name: message.attachment_name || "Image",
      });
    } else {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  };

  const downloadAttachment = async (message: ChatMessage) => {
    if (!message.attachment_path || message.deleted_at) return;
    const { data, error } = await supabase.storage
      .from("message-files")
      .createSignedUrl(message.attachment_path, 60 * 60, {
        download: message.attachment_name || true,
      });
    if (error) {
      toast.error(error.message || "Unable to download attachment.");
      return;
    }
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = message.attachment_name || "attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleMessagePointerDown = (
    event: React.PointerEvent,
    message: ChatMessage,
  ) => {
    if ((event.target as HTMLElement).closest("button")) return;
    setPointerStart({
      x: event.clientX,
      y: event.clientY,
      messageId: message.id,
    });
  };

  const handleMessagePointerUp = (event: React.PointerEvent) => {
    if (!pointerStart) return;
    const horizontalDistance = event.clientX - pointerStart.x;
    const verticalDistance = Math.abs(event.clientY - pointerStart.y);
    if (Math.abs(horizontalDistance) > 70 && verticalDistance < 50) {
      const message = messages.find(
        (item) => item.id === pointerStart.messageId,
      );
      if (message) beginReply(message);
    }
    setPointerStart(null);
  };

  const handleMessagePointerCancel = () => setPointerStart(null);

  const selectConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    setSearchParams({ conversation: conversation.id });
  };

  const updateConversationSetting = async (
    conversation: Conversation,
    change: { hidden_at?: string | null; blocked_at?: string | null },
  ) => {
    if (!user?.id) return;
    const previous = conversationSettings[conversation.id];
    const nextSetting: ConversationSetting = {
      conversation_id: conversation.id,
      hidden_at:
        change.hidden_at !== undefined
          ? change.hidden_at
          : previous?.hidden_at || null,
      blocked_at:
        change.blocked_at !== undefined
          ? change.blocked_at
          : previous?.blocked_at || null,
    };
    const { error } = await supabase
      .from("conversation_user_settings")
      .upsert(
        { ...nextSetting, user_id: user.id },
        { onConflict: "conversation_id,user_id" },
      );
    if (error) {
      toast.error(error.message || "Unable to update conversation.");
      return;
    }
    setConversationSettings((current) => ({
      ...current,
      [conversation.id]: nextSetting,
    }));
    setOpenConversationMenuId(null);
    if (change.hidden_at) {
      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id),
      );
      if (activeConversationId === conversation.id) returnToInbox();
      toast.success("Conversation deleted from your chat list.");
    } else if (change.blocked_at) {
      toast.success("This conversation is blocked.");
    }
  };

  const returnToInbox = () => {
    setActiveConversationId("");
    setSearchParams({});
  };

  const conversationContact = (conversation: Conversation) =>
    contactById.get(
      conversation.participant_one === user?.id
        ? conversation.participant_two
        : conversation.participant_one,
    );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private messages with your school contacts.
        </p>
      </header>
      <section className="grid h-[calc(100dvh-11rem)] min-h-[32rem] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:grid-cols-[minmax(18rem,22rem)_1fr]">
        <aside
          className={`${activeConversationId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-border`}
        >
          <div className="space-y-4 border-b border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                {isContactPickerOpen && (
                  <button
                    type="button"
                    onClick={() => setIsContactPickerOpen(false)}
                    className="rounded-lg p-2 hover:bg-muted"
                    aria-label="Back to chats"
                  >
                    <FiChevronLeft />
                  </button>
                )}
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {isContactPickerOpen ? "New conversation" : "Chats"}
                </h2>
              </div>
              {isContactPickerOpen ? (
                <span className="text-xs text-muted-foreground">
                  {visibleContacts.length} people
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsContactPickerOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15"
                  aria-label="Add new conversation"
                >
                  <FiMessageCircle className="h-4 w-4" />
                  <span>New</span>
                </button>
              )}
            </div>
            <label className="relative block">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people or chats"
                aria-label="Search people or chats"
                className="h-10 w-full rounded-xl border border-transparent bg-muted/70 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:bg-background focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <div
              className="flex gap-1 overflow-x-auto pb-0.5"
              role="tablist"
              aria-label="Contact categories"
            >
              {contactCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={contactCategory === category.id}
                  onClick={() => setContactCategory(category.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${contactCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isContactPickerOpen ? (
              visibleContacts.map((contact) => (
                <button
                  key={contact.user_id}
                  type="button"
                  onClick={() => {
                    setIsContactPickerOpen(false);
                    void openConversation(contact);
                  }}
                  className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/15 text-sm font-semibold text-secondary">
                    {contact.avatar_url ? (
                      <img
                        src={contact.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      contact.display_name.trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {contact.display_name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {roleLabel[contact.contact_role]}
                    </span>
                  </span>
                </button>
              ))
            ) : isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">
                Loading inbox...
              </p>
            ) : null}
            {!isContactPickerOpen &&
              visibleConversations.map((conversation) => {
                const contact = conversationContact(conversation);
                if (
                  !contact ||
                  (contactCategory !== "all" &&
                    contact.contact_role !== contactCategory) ||
                  !contact.display_name
                    .toLowerCase()
                    .includes(search.trim().toLowerCase())
                )
                  return null;
                const latest = latestMessages[conversation.id];
                const preview = latest?.deleted_at
                  ? "This message was deleted"
                  : latest?.attachment_type?.startsWith("image/")
                    ? "Photo"
                    : latest?.attachment_path
                      ? "Document"
                      : latest?.body || "Start a conversation";
                const unread = unreadByConversation[conversation.id] || 0;
                const senderPrefix =
                  latest?.sender_id === user?.id && !latest.deleted_at
                    ? "You: "
                    : "";
                return (
                  <div
                    key={conversation.id}
                    className={`group flex items-center border-b border-border/60 transition-colors hover:bg-muted/60 ${activeConversationId === conversation.id ? "bg-primary/5" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => selectConversation(conversation)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">
                        {contact.avatar_url ? (
                          <img
                            src={contact.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          contact.display_name.trim().charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {contact.display_name}
                        </span>
                        <span
                          className={`mt-1 block truncate text-xs ${unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {senderPrefix}
                          {preview}
                        </span>
                      </span>
                    </button>
                    <div className="relative flex shrink-0 flex-col items-end gap-1 px-3 py-2">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conversation.updated_at).toLocaleDateString(
                          [],
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {unread > 0 && (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenConversationMenuId((current) =>
                              current === conversation.id
                                ? null
                                : conversation.id,
                            )
                          }
                          className={`rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 ${openConversationMenuId === conversation.id ? "opacity-100" : ""}`}
                          aria-label="Conversation options"
                          aria-expanded={
                            openConversationMenuId === conversation.id
                          }
                        >
                          <FiMoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      {openConversationMenuId === conversation.id && (
                        <div className="absolute right-2 top-full z-20 flex min-w-40 flex-col overflow-hidden rounded-xl border border-border bg-card py-1 text-foreground shadow-strong">
                          <button
                            type="button"
                            onClick={() =>
                              void updateConversationSetting(conversation, {
                                hidden_at: new Date().toISOString(),
                              })
                            }
                            className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <FiTrash2 />
                            Delete for me
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void updateConversationSetting(conversation, {
                                blocked_at: conversationSettings[
                                  conversation.id
                                ]?.blocked_at
                                  ? null
                                  : new Date().toISOString(),
                              })
                            }
                            className={`flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${conversationSettings[conversation.id]?.blocked_at ? "text-foreground" : "text-destructive hover:bg-destructive/10"}`}
                          >
                            <FiX />
                            {conversationSettings[conversation.id]?.blocked_at
                              ? "Unblock"
                              : "Block"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {!isContactPickerOpen &&
              !isLoading &&
              visibleConversations.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No chats yet. Start one with New.
                </div>
              )}
            {isContactPickerOpen && visibleContacts.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">
                No matching contacts.
              </p>
            )}
          </div>
        </aside>
        <div
          className={`${activeConversationId ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col`}
        >
          {activeConversation && activeContact ? (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={returnToInbox}
                  className="rounded-lg p-2 hover:bg-muted md:hidden"
                  aria-label="Back to inbox"
                >
                  <FiArrowLeft />
                </button>
                <button
                  type="button"
                  onClick={() => setProfileContact(activeContact)}
                  className="flex min-w-0 items-center gap-3 rounded-xl p-1 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">
                    {activeContact.avatar_url ? (
                      <img
                        src={activeContact.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      activeContact.display_name.trim().charAt(0).toUpperCase()
                    )}
                    {onlineUsers.has(activeContact.user_id) && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">
                      {activeContact.display_name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {onlineUsers.has(activeContact.user_id)
                        ? "Active now"
                        : lastSeenById[activeContact.user_id]
                          ? `Last seen ${new Date(lastSeenById[activeContact.user_id]).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
                          : "Offline"}{" "}
                      · {roleLabel[activeContact.contact_role]}
                    </span>
                  </span>
                </button>
              </header>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4 sm:p-6">
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Start the conversation with a message.
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          onPointerDown={(event) =>
                            handleMessagePointerDown(event, message)
                          }
                          onPointerUp={handleMessagePointerUp}
                          onPointerCancel={handleMessagePointerCancel}
                          className={`relative max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 pr-9 shadow-sm sm:max-w-[75%] ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border/60 bg-card text-foreground"}`}
                          style={{ touchAction: "pan-y" }}
                        >
                          {message.deleted_at ? (
                            <p className="flex items-center gap-2 py-1 text-sm italic opacity-75">
                              <FiTrash2 className="h-3.5 w-3.5" />
                              This message was deleted
                            </p>
                          ) : (
                            <>
                              {message.reply_to_id &&
                                (() => {
                                  const original = messages.find(
                                    (item) => item.id === message.reply_to_id,
                                  );
                                  return original ? (
                                    <div
                                      className={`mb-2 border-l-2 pl-2 text-xs ${mine ? "border-primary-foreground/50 text-primary-foreground/75" : "border-primary/50 text-muted-foreground"}`}
                                    >
                                      {original.deleted_at
                                        ? "Message deleted"
                                        : original.body ||
                                          original.attachment_name ||
                                          "Attachment"}
                                    </div>
                                  ) : null;
                                })()}
                              {message.body && (
                                <p className="whitespace-pre-wrap text-sm">
                                  {message.body}
                                </p>
                              )}
                              {message.attachment_path &&
                                message.attachment_type?.startsWith(
                                  "image/",
                                ) && (
                                  <div className="mt-2 flex items-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void openAttachment(message)
                                      }
                                      className="overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      aria-label={`View ${message.attachment_name || "image"}`}
                                    >
                                      {imageUrls[message.attachment_path] ? (
                                        <img
                                          src={
                                            imageUrls[message.attachment_path]
                                          }
                                          alt={
                                            message.attachment_name ||
                                            "Shared image"
                                          }
                                          className="max-h-72 max-w-[min(65vw,22rem)] rounded-xl object-contain"
                                        />
                                      ) : (
                                        <span className="flex h-32 w-48 items-center justify-center rounded-xl bg-muted/70">
                                          <FiImage className="h-6 w-6" />
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void downloadAttachment(message)
                                      }
                                      className="rounded-full bg-background/80 p-2 text-foreground shadow-sm hover:bg-background"
                                      title="Download image"
                                      aria-label="Download image"
                                    >
                                      <FiDownload className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              {message.attachment_path &&
                                !message.attachment_type?.startsWith(
                                  "image/",
                                ) && (
                                  <div className="mt-2 flex max-w-full items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void openAttachment(message)
                                      }
                                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg p-2 text-left text-xs underline ${mine ? "bg-primary-foreground/10" : "bg-background/70"}`}
                                    >
                                      <FiFileText className="shrink-0" />
                                      <span className="truncate">
                                        {message.attachment_name ||
                                          "Attachment"}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void downloadAttachment(message)
                                      }
                                      className="rounded-full bg-background/80 p-2 text-foreground hover:bg-background"
                                      title="Download attachment"
                                      aria-label="Download attachment"
                                    >
                                      <FiDownload className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                            </>
                          )}
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {message.edited_at && <span>Edited</span>}
                            <span>
                              {new Date(message.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                            {mine &&
                              (message.read_at ? (
                                <span
                                  title="Read"
                                  aria-label="Read"
                                  className="inline-flex h-4 w-5 shrink-0 items-center whitespace-nowrap font-extrabold text-orange-400"
                                >
                                  <FiCheck className="h-3.5 w-3.5 shrink-0 stroke-[3]" />
                                  <FiCheck className="-ml-1.5 h-3.5 w-3.5 shrink-0 stroke-[3]" />
                                </span>
                              ) : (
                                <FiCheck
                                  className="text-primary-foreground/70"
                                  title="Sent"
                                  aria-label="Sent"
                                />
                              ))}
                          </div>
                          {!message.deleted_at && (
                            <div className="absolute right-1 top-1 z-10">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMessageMenuId((current) =>
                                    current === message.id ? null : message.id,
                                  )
                                }
                                className={`rounded-full bg-background/80 p-1.5 text-foreground shadow-sm transition-opacity hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 ${openMessageMenuId === message.id ? "opacity-100" : ""}`}
                                title="Message options"
                                aria-label="Message options"
                                aria-expanded={openMessageMenuId === message.id}
                              >
                                <FiChevronDown className="h-4 w-4" />
                              </button>
                              {openMessageMenuId === message.id && (
                                <div className="absolute right-0 top-full mt-1 flex min-w-36 flex-col overflow-hidden rounded-xl border border-border bg-card py-1 text-foreground shadow-strong">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      beginReply(message);
                                      setOpenMessageMenuId(null);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  >
                                    <FiCornerUpLeft />
                                    Reply
                                  </button>
                                  {mine && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        beginEdit(message);
                                        setOpenMessageMenuId(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                    >
                                      <FiEdit2 />
                                      Edit
                                    </button>
                                  )}
                                  {mine && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPendingDelete(message);
                                        setOpenMessageMenuId(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                                    >
                                      <FiTrash2 />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {isBlockedByMe ? (
                <div className="border-t border-border bg-card p-4 text-center text-sm text-muted-foreground">
                  This conversation is blocked. Use its chat menu to unblock it.
                </div>
              ) : (
                <form
                  onSubmit={sendMessage}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files[0];
                    if (file) selectAttachment(file);
                  }}
                  className="space-y-2 border-t border-border bg-card p-3 sm:p-4"
                >
                  {(replyTo || editingMessage) && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-foreground">
                      {editingMessage ? (
                        <FiEdit2 className="shrink-0" />
                      ) : (
                        <FiCornerUpLeft className="shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {editingMessage
                          ? "Editing your message"
                          : `Replying to: ${replyTo?.body || replyTo?.attachment_name || "Attachment"}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessage(null);
                          setReplyTo(null);
                          setDraft("");
                        }}
                        className="rounded p-1 hover:bg-background"
                        aria-label="Cancel reply or edit"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                  {attachment && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted p-2">
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt="Attachment preview"
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <FiFileText className="mx-3 h-5 w-5 shrink-0 text-primary" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {attachment.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={clearAttachment}
                        className="rounded p-2 hover:bg-background"
                        aria-label="Remove attachment"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <label
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-input bg-muted/40 text-muted-foreground transition-colors hover:bg-muted ${editingMessage ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      title="Attach image or document"
                    >
                      <FiPaperclip />
                      <input
                        type="file"
                        className="sr-only"
                        disabled={Boolean(editingMessage)}
                        accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(event) => {
                          selectAttachment(event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        editingMessage
                          ? "Edit your message..."
                          : "Write a message or drop a file..."
                      }
                      aria-label="Write a message"
                      maxLength={5000}
                      rows={2}
                      className="max-h-36 min-h-11 resize-y rounded-2xl border-transparent bg-muted/40 focus-visible:bg-background"
                    />
                    <Button
                      type="submit"
                      aria-label="Send message"
                      disabled={
                        (!draft.trim() &&
                          !attachment &&
                          !editingMessage?.attachment_path) ||
                        isSending
                      }
                      className="h-11 w-11 shrink-0 rounded-full p-0 sm:w-auto sm:px-4"
                    >
                      {editingMessage ? <FiCheckCircle /> : <FiSend />}
                      <span className="hidden sm:inline">
                        {isSending
                          ? "Saving"
                          : editingMessage
                            ? "Save"
                            : "Send"}
                      </span>
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <FiMessageCircle className="h-8 w-8 opacity-50" />
              <p className="text-sm">
                Choose a conversation or contact to begin.
              </p>
            </div>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete message?"
        description="The message will be replaced with a deleted-message notice for everyone in this conversation."
        confirmLabel="Delete message"
        variant="destructive"
        onConfirm={() => {
          if (pendingDelete) void deleteMessage(pendingDelete);
        }}
      />
      {profileContact && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${profileContact.display_name} profile`}
          onClick={() => setProfileContact(null)}
        >
          <section
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-strong"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setProfileContact(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close profile"
              >
                <FiX />
              </button>
            </div>
            <div className="px-6 pb-7 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-semibold text-primary">
                {profileContact.avatar_url ? (
                  <img
                    src={profileContact.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileContact.display_name.trim().charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {profileContact.display_name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {roleLabel[profileContact.contact_role]}
              </p>
              <div className="mt-6 border-t border-border pt-4 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="mt-1 break-all text-sm text-foreground">
                  {profileContact.email || "Not available"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full"
                onClick={() => setProfileContact(null)}
              >
                Close profile
              </Button>
            </div>
          </section>
        </div>
      )}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.name}
          onClick={() => setViewingImage(null)}
        >
          <div
            className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card shadow-strong"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {viewingImage.name}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const message = messages.find(
                      (item) => item.attachment_path === viewingImage.path,
                    );
                    if (message) void downloadAttachment(message);
                  }}
                >
                  <FiDownload />
                  Download
                </Button>
                <button
                  type="button"
                  onClick={() => setViewingImage(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close image viewer"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-black/90 p-2 sm:p-5">
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                className="max-h-[calc(100dvh-9rem)] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
