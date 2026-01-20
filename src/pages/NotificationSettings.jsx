import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, MessageCircle, Calendar, Briefcase, Star, ThumbsUp, CheckSquare, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const notificationCategories = [
  {
    key: "messages",
    label: "Direct Messages",
    description: "Get notified when someone sends you a message",
    icon: MessageCircle
  },
  {
    key: "booking_requests",
    label: "Booking Requests",
    description: "Alerts when someone books your service",
    icon: Calendar
  },
  {
    key: "booking_updates",
    label: "Booking Status Updates",
    description: "Updates on your bookings (confirmations, cancellations)",
    icon: Calendar
  },
  {
    key: "project_updates",
    label: "Project Updates",
    description: "Activity on projects you're part of",
    icon: Briefcase
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "When someone leaves a review for your service",
    icon: Star
  },
  {
    key: "endorsements",
    label: "Skill Endorsements",
    description: "When someone endorses your skills",
    icon: ThumbsUp
  },
  {
    key: "project_applications",
    label: "Project Applications",
    description: "Applications to your projects",
    icon: Users
  },
  {
    key: "feed_interactions",
    label: "Feed Interactions",
    description: "Applauds, comments, and shares on your posts",
    icon: ThumbsUp
  },
  {
    key: "task_assignments",
    label: "Task Assignments",
    description: "When you're assigned to a task",
    icon: CheckSquare
  }
];

export default function NotificationSettings({ currentUser: propUser }) {
  const [currentUser, setCurrentUser] = useState(propUser);
  const [preferences, setPreferences] = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Initialize preferences with defaults if not set
      const prefs = user.notification_preferences || {
        messages: true,
        booking_requests: true,
        booking_updates: true,
        project_updates: true,
        reviews: true,
        endorsements: true,
        project_applications: true,
        feed_interactions: true,
        task_assignments: true
      };
      setPreferences(prefs);
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        notification_preferences: preferences
      });
      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = () => {
    const allEnabled = {};
    notificationCategories.forEach(cat => {
      allEnabled[cat.key] = true;
    });
    setPreferences(allEnabled);
  };

  const handleDisableAll = () => {
    const allDisabled = {};
    notificationCategories.forEach(cat => {
      allDisabled[cat.key] = false;
    });
    setPreferences(allDisabled);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bell className="w-8 h-8 text-purple-600" />
          Notification Settings
        </h1>
        <p className="text-gray-600">Choose what notifications you want to receive</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize your notification experience. You can always change these settings later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.key} className="flex items-start justify-between py-4 border-b last:border-b-0">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={category.key} className="text-base font-medium cursor-pointer">
                      {category.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                </div>
                <Switch
                  id={category.key}
                  checked={preferences?.[category.key] ?? true}
                  onCheckedChange={() => handleToggle(category.key)}
                  className="mt-1"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleSave} disabled={isSaving} className="cu-button">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
        <Button variant="outline" onClick={handleEnableAll}>
          Enable All
        </Button>
        <Button variant="outline" onClick={handleDisableAll}>
          Disable All
        </Button>
      </div>
    </div>
  );
}