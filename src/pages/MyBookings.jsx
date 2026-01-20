import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MessageCircle, Star, CheckCircle, XCircle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookingReviewDialog from "../components/BookingReviewDialog";
import BookingActionDialog from "../components/BookingActionDialog";
import BookingDialog from "../components/BookingDialog";

export default function MyBookings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showRebookDialog, setShowRebookDialog] = useState(false);
  const [rebookService, setRebookService] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadBookings();
    }
  }, [currentUser]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      navigate(createPageUrl("Welcome"));
    }
  };

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const asClient = await base44.entities.ServiceBooking.filter({
        client_email: currentUser.email
      }, "-created_date");

      const asProvider = await base44.entities.ServiceBooking.filter({
        provider_email: currentUser.email
      }, "-created_date");

      setBookings([...asClient, ...asProvider]);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactProvider = async (booking) => {
    try {
      const otherEmail = booking.client_email === currentUser.email ? booking.provider_email : booking.client_email;
      const conversations = await base44.entities.Conversation.filter({
        conversation_type: "direct"
      });

      const existingConversation = conversations.find(conv =>
        (conv.participant_1_email === currentUser.email && conv.participant_2_email === otherEmail) ||
        (conv.participant_2_email === currentUser.email && conv.participant_1_email === otherEmail)
      );

      if (existingConversation) {
        navigate(createPageUrl("Chat") + "?conversation=" + existingConversation.id);
      } else {
        const newConversation = await base44.entities.Conversation.create({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: otherEmail
        });
        navigate(createPageUrl("Chat") + "?conversation=" + newConversation.id);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to open conversation");
    }
  };

  const handleRebook = async (booking) => {
    try {
      const listing = await base44.entities.ServiceListing.filter({
        id: booking.service_listing_id
      });
      
      if (listing && listing.length > 0) {
        const provider = await base44.entities.User.filter({
          email: booking.provider_email
        });
        
        setRebookService({ listing: listing[0], provider: provider[0] });
        setShowRebookDialog(true);
      } else {
        toast.error("Service is no longer available");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load service details");
    }
  };

  const filterBookings = (status) => {
    const now = new Date();
    return bookings.filter(booking => {
      const bookingDateTime = parseISO(`${booking.booking_date}T${booking.start_time}`);
      
      if (status === "upcoming") {
        return (booking.status === "pending" || booking.status === "confirmed") && isFuture(bookingDateTime);
      } else if (status === "past") {
        return booking.status === "completed" || (booking.status === "confirmed" && isPast(bookingDateTime));
      } else if (status === "cancelled") {
        return booking.status === "cancelled";
      }
      return false;
    });
  };

  const getStatusBadge = (booking) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800"
    };

    return (
      <Badge className={statusColors[booking.status] || "bg-gray-100 text-gray-800"}>
        {booking.status}
      </Badge>
    );
  };

  const renderBookingCard = (booking) => {
    const isProvider = booking.provider_email === currentUser.email;
    const otherParty = isProvider ? booking.client_name : booking.provider_name;
    const bookingDateTime = parseISO(`${booking.booking_date}T${booking.start_time}`);
    const isPastBooking = isPast(bookingDateTime);

    return (
      <Card key={booking.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {booking.service_title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{isProvider ? "Client" : "Provider"}: {otherParty}</span>
              </div>
            </div>
            {getStatusBadge(booking)}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>{format(parseISO(booking.booking_date), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>{booking.start_time} - {booking.end_time} ({booking.duration_minutes} min)</span>
            </div>
          </div>

          {booking.client_notes && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700"><strong>Notes:</strong> {booking.client_notes}</p>
            </div>
          )}

          {booking.rating && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < booking.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              {booking.review && <span className="text-sm text-gray-700">"{booking.review}"</span>}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {isProvider && booking.status === "pending" && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowActionDialog(true);
                }}
                className="cu-button"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept / Decline
              </Button>
            )}

            {!isProvider && booking.status === "completed" && !booking.rating && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowReviewDialog(true);
                }}
                className="cu-button"
              >
                <Star className="w-4 h-4 mr-1" />
                Leave Review
              </Button>
            )}

            {!isProvider && isPastBooking && booking.status !== "cancelled" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRebook(booking)}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Rebook
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleContactProvider(booking)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your service bookings as a client and provider</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({filterBookings("upcoming").length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({filterBookings("past").length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({filterBookings("cancelled").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid gap-4">
            {filterBookings("upcoming").length > 0 ? (
              filterBookings("upcoming").map(renderBookingCard)
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No upcoming bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-4">
            {filterBookings("past").length > 0 ? (
              filterBookings("past").map(renderBookingCard)
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No past bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="grid gap-4">
            {filterBookings("cancelled").length > 0 ? (
              filterBookings("cancelled").map(renderBookingCard)
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No cancelled bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedBooking && (
        <>
          <BookingReviewDialog
            open={showReviewDialog}
            onClose={() => {
              setShowReviewDialog(false);
              setSelectedBooking(null);
            }}
            booking={selectedBooking}
            onReviewSubmitted={loadBookings}
          />
          
          <BookingActionDialog
            open={showActionDialog}
            onClose={() => {
              setShowActionDialog(false);
              setSelectedBooking(null);
            }}
            booking={selectedBooking}
            onActionCompleted={loadBookings}
          />
        </>
      )}

      {rebookService && (
        <BookingDialog
          open={showRebookDialog}
          onClose={() => {
            setShowRebookDialog(false);
            setRebookService(null);
          }}
          listing={rebookService.listing}
          provider={rebookService.provider}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}