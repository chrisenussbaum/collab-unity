import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function ProjectBookingDialog({ isOpen, onClose, project, marketplaceListing, seller, currentUser }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [clientNotes, setClientNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Generate simple time slots (9 AM - 5 PM by default)
  useEffect(() => {
    if (selectedDate) {
      generateDefaultSlots();
    }
  }, [selectedDate]);

  const generateDefaultSlots = () => {
    const slots = [];
    const sessionDuration = marketplaceListing?.consultation_duration_minutes || 60;
    
    // Generate slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = hour + Math.floor(sessionDuration / 60);
      const endMin = sessionDuration % 60;
      const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
      
      if (endHour <= 17) {
        slots.push({ start: startTime, end: endTime });
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setIsBooking(true);
    try {
      // Create a service booking for the marketplace project
      const booking = await base44.entities.ServiceBooking.create({
        service_listing_id: project.id, // Using project ID as service listing ID
        provider_email: project.created_by,
        provider_name: seller?.full_name || 'Project Owner',
        client_email: currentUser.email,
        client_name: currentUser.full_name,
        service_title: `${project.title} - Consultation`,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTimeSlot.start,
        end_time: selectedTimeSlot.end,
        duration_minutes: marketplaceListing?.consultation_duration_minutes || 60,
        client_notes: clientNotes,
        status: "pending"
      });

      // Create notification for project owner
      await base44.entities.Notification.create({
        user_email: project.created_by,
        title: "New Marketplace Booking Request",
        message: `${currentUser.full_name} wants to book a consultation about "${project.title}"`,
        type: "project_application",
        related_project_id: project.id,
        related_entity_id: booking.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        read: false
      });

      toast.success("Booking request sent successfully!");
      onClose();
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setClientNotes("");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const maxDate = addDays(new Date(), 30);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            Book: {project?.title}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Session Duration: {marketplaceListing?.consultation_duration_minutes || 60} minutes
            {marketplaceListing?.price && (
              <span className="ml-2 font-semibold text-purple-600">
                • ${marketplaceListing.price}
              </span>
            )}
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
              <p>👤 Project Owner: {seller?.full_name || 'Owner'}</p>
              {marketplaceListing?.price && (
                <p className="font-semibold">💰 ${marketplaceListing.price}</p>
              )}
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