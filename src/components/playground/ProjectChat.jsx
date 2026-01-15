import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ProjectChat({ project, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (project?.id) {
      loadMessages();
      subscribeToMessages();
    }
  }, [project?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const subscribeToMessages = () => {
    if (!project?.id) return;

    const unsubscribe = base44.entities.CodeProjectMessage.subscribe((event) => {
      if (event.data?.project_id === project.id) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
        }
      }
    });

    return () => unsubscribe();
  };

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.CodeProjectMessage.filter({
        project_id: project.id
      }, '-created_date', 100);
      setMessages(msgs?.reverse() || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await base44.entities.CodeProjectMessage.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        user_avatar: currentUser.profile_image,
        content: newMessage.trim(),
        type: "message"
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 border-l border-gray-700">
      <div className="p-3 border-b border-gray-700 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        <span className="font-semibold text-sm">Project Chat</span>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_email === currentUser.email;
            const isSystem = msg.type === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center text-xs text-gray-400 py-2">
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={msg.user_avatar} />
                  <AvatarFallback className="bg-purple-600 text-white text-xs">
                    {msg.user_name?.[0] || msg.user_email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-300">
                      {isOwn ? 'You' : msg.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${
                      isOwn
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newMessage.trim() || isSending}
            className="px-3"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}