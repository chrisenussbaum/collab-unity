import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, addDays, parse, isAfter, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { createServiceBooking } from "@/functions/createServiceBooking";

export default function BookingDialog({ open, onClose, listing, provider, currentUser }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [clientNotes, setClientNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (open && listing?.id) {
      loadExistingBookings();
    }
  }, [open, listing?.id]);

  useEffect(() => {
    if (selectedDate && listing?.weekly_availability) {
      generateAvailableSlots();
    }
  }, [selectedDate, existingBookings]);

  const loadExistingBookings = async () => {
    setIsLoading(true);
    try {
      const bookings = await base44.entities.ServiceBooking.filter({
        service_listing_id: listing.id,
        status: { $in: ["pending", "confirmed"] }
      });
      setExistingBookings(bookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAvailableSlots = () => {
    const dayName = format(selectedDate, "EEEE").toLowerCase();
    const dayAvailability = listing.weekly_availability?.[dayName] || [];
    
    if (dayAvailability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots = [];
    const sessionDuration = listing.session_duration_minutes || 60;
    const bufferTime = listing.buffer_time_minutes || 0;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    dayAvailability.forEach(timeRange => {
      const [startHour, startMin] = timeRange.start.split(":").map(Number);
      const [endHour, endMin] = timeRange.end.split(":").map(Number);
      
      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      while (currentTime + sessionDuration <= endTime) {
        const slotStartHour = Math.floor(currentTime / 60);
        const slotStartMin = currentTime % 60;
        const slotStart = `${String(slotStartHour).padStart(2, "0")}:${String(slotStartMin).padStart(2, "0")}`;
        
        const slotEndTime = currentTime + sessionDuration;
        const slotEndHour = Math.floor(slotEndTime / 60);
        const slotEndMin = slotEndTime % 60;
        const slotEnd = `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMin).padStart(2, "0")}`;

        const isBooked = existingBookings.some(booking => {
          if (booking.booking_date !== dateStr) return false;
          const bookingStart = booking.start_time;
          const bookingEnd = booking.end_time;
          return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
        });

        if (!isBooked) {
          slots.push({ start: slotStart, end: slotEnd });
        }

        currentTime += sessionDuration + bufferTime;
      }
    });

    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setIsBooking(true);
    try {
      const { data } = await createServiceBooking({
        service_listing_id: listing.id,
        provider_email: provider.email,
        provider_name: provider.full_name,
        client_email: currentUser.email,
        client_name: currentUser.full_name,
        service_title: listing.title,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTimeSlot.start,
        end_time: selectedTimeSlot.end,
        duration_minutes: listing.session_duration_minutes || 60,
        client_notes: clientNotes
      });

      toast.success("Booking request sent successfully!");
      onClose();
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const maxDate = addDays(new Date(), listing?.advance_booking_days || 30);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            Book: {listing?.title}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Session Duration: {listing?.session_duration_minutes || 60} minutes
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div>
            <Label className="mb-2 block">Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date > maxDate}
              className="rounded-md border"
            />
          </div>

          <div>
            <Label className="mb-2 block">Available Time Slots</Label>
            {!selectedDate ? (
              <p className="text-sm text-gray-500">Please select a date first</p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {availableSlots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant={selectedTimeSlot?.start === slot.start ? "default" : "outline"}
                    className={selectedTimeSlot?.start === slot.start ? "cu-button" : ""}
                    onClick={() => setSelectedTimeSlot(slot)}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {slot.start}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Add any additional details or requirements..."
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            rows={3}
          />
        </div>

        {selectedDate && selectedTimeSlot && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm text-purple-700">
              <p>📅 {format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              <p>⏰ {selectedTimeSlot.start} - {selectedTimeSlot.end}</p>
              <p>👤 Provider: {provider?.full_name}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTimeSlot || isBooking}
            className="cu-button"
          >
            {isBooking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}