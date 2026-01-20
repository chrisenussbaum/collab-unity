import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const DEFAULT_TIMES = {
  start_time: '09:00',
  end_time: '17:00'
};

export default function ManageAvailability({ currentUser }) {
  const [availability, setAvailability] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [currentUser]);

  const loadAvailability = async () => {
    try {
      const existingAvailability = await base44.entities.ProviderAvailability.filter({
        provider_email: currentUser.email
      });

      const availabilityMap = {};
      existingAvailability.forEach(slot => {
        availabilityMap[slot.day_of_week] = slot;
      });

      setAvailability(availabilityMap);
    } catch (error) {
      console.error("Error loading availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayValue) => {
    setAvailability(prev => {
      const current = prev[dayValue];
      if (current) {
        return {
          ...prev,
          [dayValue]: {
            ...current,
            is_available: !current.is_available
          }
        };
      } else {
        return {
          ...prev,
          [dayValue]: {
            provider_email: currentUser.email,
            day_of_week: dayValue,
            ...DEFAULT_TIMES,
            is_available: true
          }
        };
      }
    });
  };

  const updateTime = (dayValue, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Delete existing availability
      const existing = await base44.entities.ProviderAvailability.filter({
        provider_email: currentUser.email
      });
      
      for (const slot of existing) {
        await base44.entities.ProviderAvailability.delete(slot.id);
      }

      // Create new availability slots
      for (const [dayValue, slot] of Object.entries(availability)) {
        if (slot.is_available) {
          await base44.entities.ProviderAvailability.create({
            provider_email: currentUser.email,
            day_of_week: parseInt(dayValue),
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: true
          });
        }
      }

      toast.success("Availability updated successfully");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading availability...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Manage Your Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map(day => {
          const daySlot = availability[day.value] || {
            is_available: false,
            ...DEFAULT_TIMES
          };

          return (
            <div key={day.value} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={daySlot.is_available}
                  onCheckedChange={() => toggleDay(day.value)}
                />
                <Label className="w-24 font-medium">{day.label}</Label>
              </div>

              {daySlot.is_available && (
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={daySlot.start_time}
                    onChange={(e) => updateTime(day.value, 'start_time', e.target.value)}
                    className="px-3 py-2 border rounded-lg cu-text-responsive-xs"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={daySlot.end_time}
                    onChange={(e) => updateTime(day.value, 'end_time', e.target.value)}
                    className="px-3 py-2 border rounded-lg cu-text-responsive-xs"
                  />
                </div>
              )}
            </div>
          );
        })}

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full cu-button"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Availability"}
        </Button>
      </CardContent>
    </Card>
  );
}