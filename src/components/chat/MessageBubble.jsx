import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Check, CheckCheck, Image as ImageIcon, Video, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import ClickableImage from "../ClickableImage";

export default function MessageBubble({ 
  message, 
  isOwn, 
  senderProfile, 
  onDelete,
  showAvatar = true,
  isGroupChat = false,
  isRead = false
}) {
  const renderMediaContent = () => {
    if (!message.media_url) return null;

    if (message.media_type === 'image') {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
          <ClickableImage
            src={message.media_url}
            alt="Shared image"
            caption="Shared image"
            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          />
        </div>
      );
    }

    if (message.media_type === 'video') {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
          <video 
            src={message.media_url} 
            controls 
            className="w-full h-auto rounded-lg"
            preload="metadata"
          />
        </div>
      );
    }

    if (message.media_type === 'file') {
      return (
        <a
          href={message.media_url}
          download={message.media_name}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center space-x-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <FileText className="w-8 h-8 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.media_name || 'File'}</p>
            {message.media_size && (
              <p className="text-xs opacity-75">
                {(message.media_size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <Download className="w-4 h-4 flex-shrink-0" />
        </a>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`flex items-end space-x-2 max-w-[75%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isOwn && showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={senderProfile?.profile_image} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
              {senderProfile?.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="relative">
          {!isOwn && isGroupChat && (
            <p className="text-xs text-gray-500 mb-1 px-2">
              {senderProfile?.full_name || message.sender_email}
            </p>
          )}
          <div className={`rounded-2xl px-4 py-2 ${
            isOwn 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
            {renderMediaContent()}
          </div>
          <div className="flex items-center justify-between mt-1 px-2">
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(message.created_date), { addSuffix: true })}
              </p>
              {isOwn && (
                <div className="flex items-center">
                  {message.read_by && message.read_by.length > 0 ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" title="Read" />
                  ) : message.is_read ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" title="Read" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-400" title="Sent" />
                  )}
                </div>
              )}
            </div>
            {isOwn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(message)}
                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}