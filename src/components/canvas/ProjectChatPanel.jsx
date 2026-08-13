import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Smile, Users } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MessageBubble from "@/components/chat/MessageBubble";
import MediaAttachmentButton from "@/components/chat/MediaAttachmentButton";
import EmojiPicker from "emoji-picker-react";
import OptimizedAvatar from "../OptimizedAvatar";
import { getCachedUserProfiles } from "@/lib/userProfileCache";

export default function ProjectChatPanel({ open, onClose, project, currentUser, projectUsers }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);

  const participants = project?.collaborator_emails || (currentUser?.email ? [currentUser.email] : []);
  const collaborators = (projectUsers || []).filter((u) => participants.includes(u.email));

  // Find or create the project's group conversation
  useEffect(() => {
    if (!open || !project?.id || !currentUser) return;
    let cancelled = false;
    const init = async () => {
      try {
        const desired = participants.length > 0 ? participants : [currentUser.email];
        const existing = await base44.entities.Conversation.filter({ project_id: project.id, conversation_type: "group" });
        let conv = existing && existing[0];
        if (!conv) {
          const unreadCounts = {};
          desired.forEach((e) => { unreadCounts[e] = 0; });
          conv = await base44.entities.Conversation.create({
            conversation_type: "group",
            project_id: project.id,
            group_name: project.title || "Project Chat",
            participants: desired,
            admin_emails: [project.created_by || currentUser.email],
            last_message: "",
            last_message_time: new Date().toISOString(),
            unread_counts: unreadCounts,
          });
        } else {
          const have = new Set(conv.participants || []);
          const want = new Set(desired);
          const same = have.size === want.size && [...want].every((e) => have.has(e));
          if (!same) {
            const merged = Array.from(new Set([...(conv.participants || []), ...desired]));
            const unreadCounts = { ...(conv.unread_counts || {}) };
            merged.forEach((e) => { if (!(e in unreadCounts)) unreadCounts[e] = 0; });
            await base44.entities.Conversation.update(conv.id, { participants: merged, unread_counts: unreadCounts });
            conv = { ...conv, participants: merged, unread_counts: unreadCounts };
          }
        }
        if (cancelled) return;
        setConversation(conv);
      } catch (e) {
        console.error("Failed to init project chat", e);
        toast.error("Could not open project chat");
      }
    };
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id, currentUser?.email]);

  // Load messages + profiles, mark unread as read
  useEffect(() => {
    if (!open || !conversation) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await base44.entities.Message.filter({ conversation_id: conversation.id }, "created_date");
        if (cancelled) return;
        setMessages(msgs || []);
        const emails = conversation.participants || [];
        if (emails.length) {
          try { const p = await getCachedUserProfiles(emails); if (!cancelled) setProfiles(p || {}); } catch {}
        }
        const unread = (msgs || []).filter((m) => m.sender_email !== currentUser.email && !(m.read_by || []).includes(currentUser.email));
        if (unread.length > 0) {
          await Promise.all(unread.map((m) => base44.entities.Message.update(m.id, { read_by: [...(m.read_by || []), currentUser.email] })));
          const uc = { ...(conversation.unread_counts || {}) };
          uc[currentUser.email] = 0;
          await base44.entities.Conversation.update(conversation.id, { unread_counts: uc }).catch(() => {});
        }
        requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView());
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conversation?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!open || !conversation) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      const m = event.data;
      if (!m || m.conversation_id !== conversation.id) return;
      if (event.type === "create") {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.sender_email !== currentUser.email) {
          base44.entities.Message.update(m.id, { read_by: [...(m.read_by || []), currentUser.email] }).catch(() => {});
        }
      } else if (event.type === "update") {
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      } else if (event.type === "delete") {
        setMessages((prev) => prev.filter((x) => x.id !== event.id));
      }
    });
    return unsub;
  }, [open, conversation?.id, currentUser?.email]);

  useEffect(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, [messages.length]);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const bumpUnread = (preview) => {
    const uc = { ...(conversation?.unread_counts || {}) };
    (conversation?.participants || []).forEach((email) => { if (email !== currentUser.email) uc[email] = (uc[email] || 0) + 1; });
    return base44.entities.Conversation.update(conversation.id, {
      last_message: preview,
      last_message_time: new Date().toISOString(),
      unread_counts: uc,
    }).catch(() => {});
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const content = newMessage.trim();
    if (!content || !conversation || isSending) return;
    setIsSending(true);
    setNewMessage("");
    setShowMention(false);
    try {
      const created = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        content,
        is_read: false,
        read_by: [],
      });
      setMessages((prev) => [...prev, created]);
      await bumpUnread(content.substring(0, 100));
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleMedia = async (file, mediaType) => {
    if (!conversation) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setIsSending(true);
      const created = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        content: "",
        is_read: false,
        read_by: [],
        media_url: file_url,
        media_type: mediaType,
        media_name: file.name,
        media_size: file.size,
      });
      setMessages((prev) => [...prev, created]);
      const preview = mediaType === "image" ? "📷 Image" : mediaType === "video" ? "🎥 Video" : `📎 ${file.name}`;
      await bumpUnread(preview);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
      setIsSending(false);
    }
  };

  const handleEdit = async (message, newContent) => {
    try {
      await base44.entities.Message.update(message.id, { content: newContent, is_edited: true });
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, content: newContent, is_edited: true } : m)));
    } catch (e) {
      toast.error("Failed to edit message");
    }
  };

  const handleDelete = async (message) => {
    try {
      await base44.entities.Message.delete(message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (e) {
      toast.error("Failed to delete message");
    }
  };

  const handleMessageChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    const cursor = e.target.selectionStart;
    const upTo = val.slice(0, cursor);
    const m = upTo.match(/@(\w*)$/);
    if (m) {
      setMentionQuery(m[1] || "");
      setShowMention(true);
    } else {
      setShowMention(false);
    }
  };

  const handleMentionSelect = (user) => {
    const input = inputRef.current;
    const cursor = input ? input.selectionStart : newMessage.length;
    const upTo = newMessage.slice(0, cursor);
    const atIdx = upTo.search(/@\w*$/);
    const before = newMessage.slice(0, atIdx);
    const after = newMessage.slice(cursor);
    const token = `@${user.full_name || user.email} `;
    setNewMessage(`${before}${token}${after}`);
    setShowMention(false);
    setMentionQuery("");
    setTimeout(() => {
      if (inputRef.current) {
        const pos = before.length + token.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  if (!open) return null;

  const mentionMatches = collaborators
    .filter((u) => u.email !== currentUser?.email)
    .filter((u) => {
      const q = mentionQuery.toLowerCase();
      if (!q) return true;
      const name = (u.full_name || "").toLowerCase();
      const uname = (u.username || "").toLowerCase();
      return name.includes(q) || uname.includes(q) || u.email.toLowerCase().includes(q);
    });

  return (
    <div className="fixed top-11 right-0 bottom-0 w-full sm:w-[380px] z-[130] bg-white border-l border-gray-200 shadow-2xl flex flex-col">
      <div className="h-12 flex items-center gap-2 px-3 border-b border-gray-200 flex-shrink-0">
        <MessageCircle className="w-4 h-4 text-[#18A0FB]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{project?.title} Chat</p>
          <p className="text-[11px] text-gray-500">{participants.length} collaborators</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full p-3">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
              <Users className="w-10 h-10 mb-2 text-gray-300" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs">Start the conversation with your team.</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwn = message.sender_email === currentUser.email;
                const senderProfile = profiles[message.sender_email] || { full_name: message.sender_email.split("@")[0], profile_image: null };
                const showAvatar = index === 0 || messages[index - 1].sender_email !== message.sender_email;
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    senderProfile={senderProfile}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    showAvatar={showAvatar}
                    isGroupChat
                    isRead={(message.read_by || []).length > 0}
                    currentUser={currentUser}
                    conversationParticipants={(conversation?.participants || []).filter((e) => e !== currentUser.email)}
                  />
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {showMention && mentionMatches.length > 0 && (
          <div className="absolute bottom-[64px] left-3 right-3 z-20 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
            {mentionMatches.map((u) => (
              <button
                key={u.email}
                onClick={() => handleMentionSelect(u)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
              >
                <OptimizedAvatar src={u.profile_image} alt={u.full_name} fallback={u.full_name?.[0] || "U"} size="xs" className="w-6 h-6" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">@{u.username || u.email.split("@")[0]}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 flex items-end gap-2 flex-shrink-0">
        <MediaAttachmentButton onMediaSelect={handleMedia} isUploading={isUploading} disabled={isSending} />
        <div className="relative" ref={emojiRef}>
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmoji((v) => !v)} disabled={isSending} className="text-gray-500 hover:text-purple-600">
            <Smile className="w-5 h-5" />
          </Button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPicker onEmojiClick={(d) => setNewMessage((prev) => prev + d.emoji)} width={300} height={360} />
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="flex-1 flex items-end gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleMessageChange}
            placeholder={`Message ${project?.title || ""}…  @ to mention`}
            disabled={isSending || isUploading}
            className="flex-1"
          />
          <Button type="submit" disabled={(!newMessage.trim() && !isUploading) || isSending} className="bg-[#18A0FB] hover:bg-[#0E8FE0] text-white">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}