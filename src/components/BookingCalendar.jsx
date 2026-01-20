import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Clock, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, isSameDay, startOfDay, parseISO } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BookingCalendar({ serviceListing, provider, onClose, currentUser }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState(1);
  const [clientNotes, setClientNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [providerAvailability, setProviderAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load provider availability and existing bookings
  useEffect(() => {
    loadAvailabilityData();
  }, [serviceListing.provider_email]);

  const loadAvailabilityData = async () => {
    try {
      // Get provider's availability schedule
      const availability = await base44.entities.ProviderAvailability.filter({
        provider_email: serviceListing.provider_email
      });
      setProviderAvailability(availability);

      // Get existing bookings for the provider
      const bookings = await base44.entities.Booking.filter({
        provider_email: serviceListing.provider_email,
        status: { $in: ['confirmed', 'pending_payment'] }
      });
      setExistingBookings(bookings);
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  // Generate available time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, providerAvailability, existingBookings]);

  const generateTimeSlots = () => {
    if (!selectedDate) return;

    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Get availability for this day of week
    const dayAvailability = providerAvailability.filter(a => 
      a.day_of_week === dayOfWeek && a.is_available
    );

    if (dayAvailability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots = [];
    dayAvailability.forEach(availability => {
      const [startHour, startMin] = availability.start_time.split(':').map(Number);
      const [endHour, endMin] = availability.end_time.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        // Check if this slot is already booked
        const isBooked = existingBookings.some(booking => 
          booking.booking_date === dateStr &&
          booking.start_time <= timeStr &&
          booking.end_time > timeStr
        );

        if (!isBooked) {
          slots.push(timeStr);
        }

        // Move to next 30-minute slot
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour += 1;
        }
      }
    });

    setAvailableSlots(slots);
  };

  const calculateTotal = () => {
    if (!serviceListing.rate || serviceListing.rate.type === 'negotiable') {
      return 0;
    }
    
    if (serviceListing.rate.type === 'hourly') {
      return serviceListing.rate.amount * duration;
    } else if (serviceListing.rate.type === 'fixed') {
      return serviceListing.rate.amount;
    }
    
    return 0;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    if (!currentUser) {
      toast.error("Please sign in to book a service");
      return;
    }

    setIsLoading(true);
    try {
      const [startHour, startMin] = selectedTime.split(':').map(Number);
      let endHour = startHour + Math.floor(duration);
      let endMin = startMin + ((duration % 1) * 60);
      
      if (endMin >= 60) {
        endHour += 1;
        endMin -= 60;
      }

      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      const estimatedAmount = calculateTotal();

      // Create booking directly without payment
      const booking = await base44.entities.Booking.create({
        service_listing_id: serviceListing.id,
        provider_email: serviceListing.provider_email,
        client_email: currentUser.email,
        client_name: currentUser.full_name,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTime,
        duration_hours: duration,
        estimated_amount: estimatedAmount,
        currency: 'USD',
        status: 'pending',
        client_notes: clientNotes
      });

      // Send notification to provider
      await base44.entities.Notification.create({
        user_email: serviceListing.provider_email,
        title: 'New Booking Request',
        message: `${currentUser.full_name} wants to book ${serviceListing.title} on ${format(selectedDate, 'MMM dd, yyyy')} at ${selectedTime}`,
        type: 'general',
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        metadata: {
          booking_id: booking.id,
          service_listing_id: serviceListing.id
        }
      });

      // Send notification to client
      await base44.entities.Notification.create({
        user_email: currentUser.email,
        title: 'Booking Request Sent',
        message: `Your booking request for ${serviceListing.title} has been sent to the provider`,
        type: 'general',
        metadata: {
          booking_id: booking.id,
          service_listing_id: serviceListing.id
        }
      });

      toast.success("Booking request sent! The provider will contact you to arrange payment.");
      onClose();

    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  const isDateAvailable = (date) => {
    const dayOfWeek = date.getDay();
    return providerAvailability.some(a => 
      a.day_of_week === dayOfWeek && a.is_available
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Book {serviceListing.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <Label className="mb-2 block">Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const today = startOfDay(new Date());
                return date < today || !isDateAvailable(date);
              }}
              className="border rounded-lg"
            />
          </div>

          {/* Time Slots */}
          <div>
            <Label className="mb-2 block">Available Time Slots</Label>
            {!selectedDate ? (
              <p className="text-sm text-gray-500">Please select a date first</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {availableSlots.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className="cu-text-responsive-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Duration */}
        {serviceListing.rate?.type === 'hourly' && (
          <div>
            <Label>Duration (hours)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDuration(Math.max(0.5, duration - 0.5))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold">{duration}h</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDuration(duration + 0.5)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label>Additional Notes (Optional)</Label>
          <Textarea
            placeholder="Any special requirements or questions..."
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-purple-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Date & Time:</span>
              <span className="font-semibold">
                {format(selectedDate, 'MMM dd, yyyy')} at {selectedTime}
              </span>
            </div>
            {serviceListing.rate?.type === 'hourly' && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Duration:</span>
                <span className="font-semibold">{duration} hours</span>
              </div>
            )}
            {calculateTotal() > 0 && (
              <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                <span>Estimated Cost:</span>
                <span className="text-purple-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 text-center pt-2">
              Payment details will be arranged directly with the provider
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 cu-button"
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime || isLoading}
          >
            {isLoading ? "Sending Request..." : "Request Booking"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}