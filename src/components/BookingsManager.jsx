import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, DollarSign, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function BookingsManager({ currentUser }) {
  const [bookingsAsProvider, setBookingsAsProvider] = useState([]);
  const [bookingsAsClient, setBookingsAsClient] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      // Load bookings where user is the provider
      const asProvider = await base44.entities.Booking.filter({
        provider_email: currentUser.email
      }, '-created_date');

      // Load bookings where user is the client
      const asClient = await base44.entities.Booking.filter({
        client_email: currentUser.email
      }, '-created_date');

      // Load service listings for reference
      const serviceIds = [...new Set([
        ...asProvider.map(b => b.service_listing_id),
        ...asClient.map(b => b.service_listing_id)
      ])];

      const services = {};
      for (const id of serviceIds) {
        try {
          const service = await base44.entities.ServiceListing.get(id);
          if (service) services[id] = service;
        } catch (e) {
          console.error("Error loading service:", e);
        }
      }

      setBookingsAsProvider(asProvider.map(b => ({ ...b, service: services[b.service_listing_id] })));
      setBookingsAsClient(asClient.map(b => ({ ...b, service: services[b.service_listing_id] })));
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await base44.entities.Booking.update(bookingId, {
        status: 'cancelled'
      });
      toast.success("Booking cancelled");
      loadBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await base44.entities.Booking.update(bookingId, {
        status: 'completed'
      });
      toast.success("Booking marked as completed");
      loadBookings();
    } catch (error) {
      console.error("Error completing booking:", error);
      toast.error("Failed to complete booking");
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await base44.entities.Booking.update(bookingId, {
        status: 'confirmed'
      });
      toast.success("Booking confirmed");
      loadBookings();
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Failed to confirm booking");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const BookingCard = ({ booking, isProvider }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2 flex-1">
            {booking.service && (
              <p className="font-bold text-gray-900">{booking.service.title}</p>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">
                {format(parseISO(booking.booking_date), 'EEEE, MMMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{booking.start_time} - {booking.end_time} ({booking.duration_hours}h)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>
                {isProvider ? booking.client_name : booking.provider_email}
              </span>
            </div>
            {booking.estimated_amount > 0 && (
              <div className="flex items-center gap-2 text-purple-600 font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>${booking.estimated_amount.toFixed(2)} (estimated)</span>
              </div>
            )}
          </div>
          <div className="text-right space-y-2">
            {getStatusBadge(booking.status)}
          </div>
        </div>

        {booking.client_notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Notes: </span>
              {booking.client_notes}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {isProvider && booking.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => handleConfirmBooking(booking.id)}
              className="cu-button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Booking
            </Button>
          )}
          {isProvider && booking.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => handleCompleteBooking(booking.id)}
              className="cu-button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleCancelBooking(booking.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="received">
          Received ({bookingsAsProvider.length})
        </TabsTrigger>
        <TabsTrigger value="made">
          My Bookings ({bookingsAsClient.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="mt-6">
        {bookingsAsProvider.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No bookings received yet</p>
            <p className="text-xs text-gray-400 mt-2">Set up your availability to receive booking requests</p>
          </div>
        ) : (
          bookingsAsProvider.map(booking => (
            <BookingCard key={booking.id} booking={booking} isProvider={true} />
          ))
        )}
      </TabsContent>

      <TabsContent value="made" className="mt-6">
        {bookingsAsClient.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">You haven't made any bookings yet</p>
            <p className="text-xs text-gray-400 mt-2">Browse services on the Discover page to get started</p>
          </div>
        ) : (
          bookingsAsClient.map(booking => (
            <BookingCard key={booking.id} booking={booking} isProvider={false} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}