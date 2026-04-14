import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Check, CheckCheck, Image as ImageIcon, Video, FileText, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import ClickableImage from "../ClickableImage";
import ProjectMentionCard from "./ProjectMentionCard";

export default function MessageBubble({ 
  message, 
  isOwn, 
  senderProfile, 
  onDelete,
  showAvatar = true,
  isGroupChat = false,
  isRead = false
}) {
  // Check if this is a video call message
  const isVideoCallMessage = message.metadata?.video_call;

  // Render video call invite
  const renderVideoCallInvite = () => {
    const { platform, link, iconUrl, bgColor = 'bg-purple-50', borderColor = 'border-purple-200', iconColor = 'text-purple-600' } = message.metadata.video_call;
    
    return (
      <div className={`${bgColor} p-4 rounded-xl border-2 ${borderColor} min-w-[280px]`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200">
            {iconUrl ? (
              <img 
                src={iconUrl} 
                alt={platform}
                className="w-full h-full object-contain"
              />
            ) : (
              <Video className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{platform} Video Call</p>
            <p className="text-xs text-gray-600">Click to join the meeting</p>
          </div>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 ${iconColor.replace('text-', 'bg-')} hover:opacity-90 text-white px-4 py-2.5 rounded-lg transition-all font-medium text-sm shadow-sm`}
        >
          <Video className="w-4 h-4" />
          Join Call
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  };

  // Render message content with clickable links and project mention cards
  const renderMessageContent = (content) => {
    if (!content) return null;

    // Split on ##projectId tokens (stored as ##<id>) and URLs
    // Token format: ##<projectId> (e.g. ##abc123) — title shown as #ProjectTitle at send time
    const tokenRegex = /(##[a-zA-Z0-9_-]+(?::[^#\s]+)?)/g;
    const segments = content.split(tokenRegex);

    const projectCards = [];
    const textParts = [];

    segments.forEach((seg, i) => {
      const match = seg.match(/^##([a-zA-Z0-9_-]+)(?::(.+))?$/);
      if (match) {
        const projectId = match[1];
        const projectTitle = match[2];
        textParts.push(
          <span key={`pt-${i}`} className={`font-semibold ${isOwn ? 'text-purple-200' : 'text-purple-700'}`}>
            #{projectTitle || projectId}
          </span>
        );
        projectCards.push(<ProjectMentionCard key={`pc-${i}`} projectId={projectId} isOwn={isOwn} />);
      } else {
        // Handle URLs within plain text segments
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urlParts = seg.split(urlRegex);
        urlParts.forEach((part, j) => {
          if (j % 2 === 1) {
            textParts.push(
              <a
                key={`url-${i}-${j}`}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline ${isOwn ? 'text-white underline' : 'text-blue-600'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          } else {
            textParts.push(<span key={`txt-${i}-${j}`}>{part}</span>);
          }
        });
      }
    });

    return (
      <div>
        <p className="text-sm whitespace-pre-wrap break-words">{textParts}</p>
        {projectCards}
      </div>
    );
  };

  const renderMediaContent = () => {
    if (!message.media_url) return null;

    if (message.media_type === 'image') {
      return (
        <div className="mt-2 rounded-lg overflow-hidden max-w-[280px] sm:max-w-sm">
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
        <div className="mt-2 rounded-lg overflow-hidden max-w-[280px] sm:max-w-sm">
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
          className="mt-2 flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors max-w-[280px] sm:max-w-sm"
        >
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{message.media_name || 'File'}</p>
            {message.media_size && (
              <p className="text-xs opacity-75">
                {(message.media_size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <Download className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
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
      <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
            {isVideoCallMessage ? renderVideoCallInvite() : (
              <>
                {message.content && renderMessageContent(message.content)}
                {renderMediaContent()}
              </>
            )}
          </div>
          <div className="flex items-center justify-between mt-1 px-2">
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400">
                {(() => {
                  try {
                    const messageDate = new Date(message.created_date);
                    const now = new Date();
                    // Only format if the date is valid and not in the future
                    if (messageDate <= now) {
                      return formatDistanceToNow(messageDate, { addSuffix: true });
                    }
                    return 'Just now';
                  } catch (e) {
                    return '';
                  }
                })()}
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