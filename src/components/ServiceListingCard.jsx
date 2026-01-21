import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, MessageCircle, ExternalLink, Briefcase, Play, Camera, Calendar, Globe, Link as LinkIcon } from "lucide-react";
import OptimizedAvatar from "./OptimizedAvatar";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ClickableImage from "./ClickableImage";
import BookingDialog from "./BookingDialog";

export default function ServiceListingCard({ listing, provider, currentUser }) {
  const navigate = useNavigate();
  const isOwnListing = currentUser && currentUser.email === listing.provider_email;
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const handleContactProvider = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error("Please sign in to contact service providers.");
      return;
    }

    try {
      // Check if conversation already exists
      const existingConv1 = await base44.entities.Conversation.filter({
        participant_1_email: currentUser.email,
        participant_2_email: provider.email
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        participant_1_email: provider.email,
        participant_2_email: currentUser.email
      });

      let conversation;
      if (existingConv1.length > 0) {
        conversation = existingConv1[0];
      } else if (existingConv2.length > 0) {
        conversation = existingConv2[0];
      } else {
        // Create new conversation
        conversation = await base44.entities.Conversation.create({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: provider.email,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      // Navigate to chat with this conversation
      navigate(createPageUrl(`Chat?conversation=${conversation.id}`));
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation. Please try again.");
    }
  };

  const getRateDisplay = () => {
    if (!listing.rate || listing.rate.type === "negotiable") {
      return "Negotiable";
    }
    return `$${listing.rate.amount}/${listing.rate.type === "hourly" ? "hr" : "project"}`;
  };

  return (
    <Card className="cu-card h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <Link 
              to={createPageUrl(provider?.username ? `UserProfile?username=${provider.username}` : `UserProfile?email=${listing.provider_email}`)}
              onClick={(e) => e.stopPropagation()}
            >
              <OptimizedAvatar
                src={provider?.profile_image}
                alt={provider?.full_name || 'Provider'}
                fallback={provider?.full_name?.[0] || 'P'}
                size="md"
                className="w-12 h-12 cursor-pointer"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 line-clamp-2 cu-text-responsive-sm">
                {listing.title}
              </h3>
              <Link 
                to={createPageUrl(provider?.username ? `UserProfile?username=${provider.username}` : `UserProfile?email=${listing.provider_email}`)}
                className="text-sm text-gray-600 hover:text-purple-600"
                onClick={(e) => e.stopPropagation()}
              >
                {provider?.full_name || 'Provider'}
              </Link>
            </div>
          </div>
          <Badge 
            className={
              listing.availability_status === "available" ? "bg-green-100 text-green-700" :
              listing.availability_status === "busy" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-700"
            }
          >
            {listing.availability_status}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-700 line-clamp-3">
          {listing.description}
        </p>
      </CardHeader>

      <CardContent className="flex-grow pb-3">
        <div className="space-y-3">
          <div className="flex items-center text-green-600 font-semibold">
            <DollarSign className="w-4 h-4 mr-1" />
            {getRateDisplay()}
          </div>

          {listing.booking_enabled && (
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {listing.session_duration_minutes} min sessions • Book up to {listing.advance_booking_days} days ahead
              </span>
            </div>
          )}

          {listing.skills_offered && listing.skills_offered.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.skills_offered.slice(0, 4).map((skill, idx) => (
                <Badge key={idx} className="text-xs bg-purple-100 text-purple-700">
                  {skill}
                </Badge>
              ))}
              {listing.skills_offered.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.skills_offered.length - 4}
                </Badge>
              )}
            </div>
          )}

          {listing.media_attachments && listing.media_attachments.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Service Showcase</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {listing.media_attachments.slice(0, 4).map((media, idx) => {
                  const mediaUrl = media.media_url;
                  const mediaType = media.media_type || 'image';
                  
                  return (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      {mediaType === 'video' ? (
                        <div className="relative w-full h-full">
                          {media.thumbnail_url ? (
                            <img 
                              src={media.thumbnail_url} 
                              alt={media.caption || 'Video thumbnail'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video 
                              src={mediaUrl}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <ClickableImage
                          src={mediaUrl} 
                          alt={media.caption || 'Service showcase'}
                          caption={media.caption}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>
      </CardContent>

      {listing.portfolio_links && listing.portfolio_links.length > 0 && (
        <div className="border-t bg-gray-50/50 px-3 sm:px-4 md:px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-700">Portfolio Links</span>
          </div>
          <div className="space-y-2">
            {listing.portfolio_links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-white border hover:border-purple-300 hover:shadow-sm transition-all group"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate group-hover:text-purple-600">
                    {link.title || link.url}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-600 flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}

      {!isOwnListing && (
        <CardFooter className="bg-gray-50 border-t p-4">
          <div className="w-full flex flex-col sm:flex-row gap-2">
            {listing.booking_enabled && (
              <Button
                size="sm"
                onClick={() => setShowBookingDialog(true)}
                className="flex-1 cu-button text-xs"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Book
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleContactProvider}
              className={`${listing.booking_enabled ? "flex-1" : "w-full"} text-xs`}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </Button>
          </div>
        </CardFooter>
      )}
      
      <BookingDialog
        open={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        listing={listing}
        provider={provider}
        currentUser={currentUser}
      />
    </Card>
  );
}