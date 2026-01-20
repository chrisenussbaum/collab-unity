import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, MessageCircle, ExternalLink, Briefcase } from "lucide-react";
import OptimizedAvatar from "./OptimizedAvatar";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ServiceListingCard({ listing, provider, currentUser }) {
  const navigate = useNavigate();

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
          <div className="flex items-center text-purple-600 font-semibold">
            <DollarSign className="w-4 h-4 mr-1" />
            {getRateDisplay()}
          </div>

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

          {listing.portfolio_links && listing.portfolio_links.length > 0 && (
            <div className="pt-2 border-t space-y-1">
              {listing.portfolio_links.slice(0, 2).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-purple-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {link.title || link.url}
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 border-t p-3">
        <Button
          size="sm"
          onClick={handleContactProvider}
          className="w-full cu-button"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Provider
        </Button>
      </CardFooter>
    </Card>
  );
}