import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CodePlaygroundChat({ 
  messages, 
  onSendMessage, 
  currentUser,
  collaborators,
  isMinimized,
  onToggleMinimize
}) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCollaboratorInfo = (email) => {
    return collaborators.find(c => c.email === email) || { 
      email, 
      full_name: email.split('@')[0],
      profile_image: null 
    };
  };

  return (
    <div className="flex flex-col bg-white border-l h-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium">Team Chat</span>
          {messages.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, index) => {
                    const isOwnMessage = msg.sender_email === currentUser?.email;
                    const sender = getCollaboratorInfo(msg.sender_email);
                    const showAvatar = index === 0 || messages[index - 1]?.sender_email !== msg.sender_email;

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                      >
                        {showAvatar ? (
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={sender.profile_image} />
                            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                              {sender.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-6 flex-shrink-0" />
                        )}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          {showAvatar && (
                            <span className="text-xs text-gray-500 mb-0.5">
                              {isOwnMessage ? 'You' : sender.full_name}
                            </span>
                          )}
                          <div
                            className={`px-3 py-1.5 rounded-lg max-w-[180px] text-sm break-words ${
                              isOwnMessage
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-xs text-gray-400 mt-0.5">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-2 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="text-sm h-8"
                />
                <Button 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}