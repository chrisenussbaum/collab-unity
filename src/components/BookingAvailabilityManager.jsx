import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Calendar } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday"
};

export default function BookingAvailabilityManager({ availability, onUpdate }) {
  const [bookingEnabled, setBookingEnabled] = useState(availability?.booking_enabled || false);
  const [sessionDuration, setSessionDuration] = useState(availability?.session_duration_minutes || 60);
  const [bufferTime, setBufferTime] = useState(availability?.buffer_time_minutes || 0);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(availability?.advance_booking_days || 30);
  const [weeklyAvailability, setWeeklyAvailability] = useState(
    availability?.weekly_availability || {}
  );

  const addTimeSlot = (day) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: "09:00", end: "17:00" }]
    }));
  };

  const removeTimeSlot = (day, index) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setWeeklyAvailability(prev => {
      const newSlots = [...(prev[day] || [])];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, [day]: newSlots };
    });
  };

  const handleUpdate = () => {
    onUpdate({
      booking_enabled: bookingEnabled,
      session_duration_minutes: sessionDuration,
      buffer_time_minutes: bufferTime,
      advance_booking_days: advanceBookingDays,
      weekly_availability: weeklyAvailability
    });
  };

  // Auto-update parent when values change
  React.useEffect(() => {
    handleUpdate();
  }, [bookingEnabled, sessionDuration, bufferTime, advanceBookingDays, weeklyAvailability]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Booking Availability
          </CardTitle>
          <Switch
            checked={bookingEnabled}
            onCheckedChange={setBookingEnabled}
          />
        </div>
        <p className="text-sm text-gray-500">
          {bookingEnabled ? "Booking is enabled" : "Enable booking to allow clients to schedule time with you"}
        </p>
      </CardHeader>

      {bookingEnabled && (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Session Duration (minutes)</Label>
              <Input
                type="number"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                min="15"
                step="15"
              />
            </div>
            <div>
              <Label>Buffer Time (minutes)</Label>
              <Input
                type="number"
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                min="0"
                step="5"
              />
            </div>
            <div>
              <Label>Advance Booking (days)</Label>
              <Input
                type="number"
                value={advanceBookingDays}
                onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
                min="1"
                max="90"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Weekly Schedule</h4>
            <div className="space-y-4">
              {DAYS.map(day => (
                <div key={day} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium">{DAY_LABELS[day]}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(day)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Slot
                    </Button>
                  </div>
                  
                  {weeklyAvailability[day] && weeklyAvailability[day].length > 0 ? (
                    <div className="space-y-2">
                      {weeklyAvailability[day].map((slot, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(day, index, "start", e.target.value)}
                            className="flex-1"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(day, index, "end", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeSlot(day, index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No availability set</p>
                  )}
                </div>
              ))}
            </div>
          </div>


        </CardContent>
      )}
    </Card>
  );
}