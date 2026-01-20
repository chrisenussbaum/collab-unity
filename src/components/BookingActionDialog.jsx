import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BookingActionDialog({ open, onClose, booking, onActionCompleted }) {
  const [action, setAction] = useState(null);
  const [providerNotes, setProviderNotes] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await base44.entities.ServiceBooking.update(booking.id, {
        status: "confirmed",
        provider_notes: providerNotes.trim(),
        meeting_link: meetingLink.trim()
      });

      await base44.entities.Notification.create({
        user_email: booking.client_email,
        title: "Booking Confirmed",
        message: `${booking.provider_name} confirmed your booking for "${booking.service_title}" on ${booking.booking_date} at ${booking.start_time}`,
        type: "general",
        related_entity_id: booking.id,
        actor_email: booking.provider_email,
        actor_name: booking.provider_name
      });

      toast.success("Booking confirmed!");
      onActionCompleted();
      onClose();
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast.error("Failed to confirm booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await base44.entities.ServiceBooking.update(booking.id, {
        status: "cancelled",
        cancelled_by: booking.provider_email,
        cancellation_reason: providerNotes.trim()
      });

      await base44.entities.Notification.create({
        user_email: booking.client_email,
        title: "Booking Declined",
        message: `${booking.provider_name} declined your booking request for "${booking.service_title}"`,
        type: "general",
        related_entity_id: booking.id,
        actor_email: booking.provider_email,
        actor_name: booking.provider_name
      });

      toast.success("Booking declined");
      onActionCompleted();
      onClose();
    } catch (error) {
      console.error("Error declining booking:", error);
      toast.error("Failed to decline booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!action) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Booking Request</DialogTitle>
            <p className="text-sm text-gray-500">
              {booking?.service_title} with {booking?.client_name}
            </p>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2 mb-4">
              <p className="text-sm"><strong>Date:</strong> {booking?.booking_date}</p>
              <p className="text-sm"><strong>Time:</strong> {booking?.start_time} - {booking?.end_time}</p>
              {booking?.client_notes && (
                <div className="bg-gray-50 p-3 rounded-lg mt-2">
                  <p className="text-sm"><strong>Client Notes:</strong></p>
                  <p className="text-sm text-gray-700">{booking.client_notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setAction("accept")}
                className="flex-1 cu-button"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                onClick={() => setAction("decline")}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{action === "accept" ? "Confirm" : "Decline"} Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {action === "accept" && (
            <div>
              <Label>Meeting Link (Optional)</Label>
              <Input
                placeholder="e.g., Zoom, Google Meet link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label>{action === "accept" ? "Notes for Client (Optional)" : "Reason for Declining"}</Label>
            <Textarea
              placeholder={action === "accept" ? "Add any preparation notes or instructions..." : "Let the client know why..."}
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>
            Back
          </Button>
          <Button
            onClick={action === "accept" ? handleAccept : handleDecline}
            disabled={isSubmitting}
            className={action === "accept" ? "cu-button" : "bg-red-600 hover:bg-red-700"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `${action === "accept" ? "Confirm" : "Decline"} Booking`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}