import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, MessageCircle, DollarSign, Tag, Camera, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ProjectBookingDialog from "@/components/marketplace/ProjectBookingDialog";
import ClickableImage from "@/components/ClickableImage";

export default function MarketplaceFeedCard({ project, marketplaceListing, seller, currentUser }) {
  const navigate = useNavigate();
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const isOwner = currentUser && project.created_by === currentUser.email;

  const handleChatWithOwner = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error("Please sign in to start a conversation");
      return;
    }

    try {
      const ownerEmail = project.created_by;
      
      const [existingConv1, existingConv2] = await Promise.all([
        base44.entities.Conversation.filter({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: ownerEmail
        }),
        base44.entities.Conversation.filter({
          conversation_type: "direct",
          participant_1_email: ownerEmail,
          participant_2_email: currentUser.email
        })
      ]);

      let conversation;
      if (existingConv1.length > 0) {
        conversation = existingConv1[0];
      } else if (existingConv2.length > 0) {
        conversation = existingConv2[0];
      } else {
        conversation = await base44.entities.Conversation.create({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: ownerEmail,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      navigate(createPageUrl(`Chat?conversation=${conversation.id}`));
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  const handleBookProject = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error("Please sign in to book a project consultation");
      return;
    }
    
    setShowBookingDialog(true);
  };

  return (
    <>
      {showBookingDialog && (
        <ProjectBookingDialog
          isOpen={showBookingDialog}
          onClose={() => setShowBookingDialog(false)}
          project={project}
          marketplaceListing={marketplaceListing}
          seller={seller}
          currentUser={currentUser}
        />
      )}

      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
        <Card className="cu-card border-t-4 border-green-500 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          <CardHeader className="pb-3 px-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="text-xs bg-green-100 text-green-700 mb-1">
                  Marketplace Listing
                </Badge>
                <h3 className="font-bold text-gray-900 line-clamp-2 cu-text-responsive-sm leading-tight">
                  {project.title}
                </h3>
              </div>
              {marketplaceListing && (
                <Badge className="bg-green-600 text-white font-bold text-sm flex-shrink-0">
                  ${marketplaceListing.price}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link 
                to={createPageUrl(seller?.username ? `UserProfile?username=${seller.username}` : `UserProfile?email=${project.created_by}`)}
                onClick={(e) => e.stopPropagation()}
              >
                <OptimizedAvatar
                  src={seller?.profile_image}
                  alt={seller?.full_name || 'Seller'}
                  fallback={seller?.full_name?.[0] || 'S'}
                  size="sm"
                  className="w-10 h-10 cursor-pointer"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link 
                  to={createPageUrl(seller?.username ? `UserProfile?username=${seller.username}` : `UserProfile?email=${project.created_by}`)}
                  className="text-sm text-gray-600 hover:text-purple-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {seller?.full_name || 'Seller'}
                </Link>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(project.created_date))} ago
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-grow pb-3 space-y-3 px-4">
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {project.description}
            </p>

            {marketplaceListing && (
              <Badge variant="outline" className="text-xs">
                {marketplaceListing.price_type === "consultation" 
                  ? `Consultation - ${marketplaceListing.consultation_duration_minutes} min`
                  : "Fixed Price"}
              </Badge>
            )}

            {project.area_of_interest && (
              <Badge className="text-xs bg-purple-100 text-purple-700">
                <Tag className="w-3 h-3 mr-1" />
                {project.area_of_interest}
              </Badge>
            )}

            {project.skills_needed && project.skills_needed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.skills_needed.slice(0, 4).map((skill, idx) => (
                  <Badge key={idx} className="text-xs bg-purple-100 text-purple-700">
                    {skill}
                  </Badge>
                ))}
                {project.skills_needed.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.skills_needed.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {project.highlights && project.highlights.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-700">Project Highlights</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {project.highlights.slice(0, 3).map((highlight, idx) => {
                    const mediaUrl = highlight.media_url || highlight.image_url;
                    const mediaType = highlight.media_type || 'image';
                    
                    return (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100" onClick={(e) => e.preventDefault()}>
                        {mediaType === 'video' ? (
                          <div className="relative w-full h-full">
                            {highlight.thumbnail_url ? (
                              <img 
                                src={highlight.thumbnail_url} 
                                alt={highlight.caption || 'Video thumbnail'}
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
                            alt={highlight.caption || 'Project highlight'}
                            caption={highlight.caption}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>

          {!isOwner && (
            <CardFooter className="bg-gray-50 border-t p-4">
              <div className="w-full flex gap-2">
                <Button 
                  size="sm" 
                  className="cu-button flex-1 text-xs"
                  onClick={handleBookProject}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Book
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={handleChatWithOwner}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chat
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </Link>
    </>
  );
}