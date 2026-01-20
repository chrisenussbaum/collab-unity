import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    setSessionId(id);
  }, []);

  return (
    <div className="cu-container cu-page min-h-screen flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            Your booking has been successfully confirmed. You will receive a confirmation email shortly with all the details.
          </p>

          {sessionId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Session ID</p>
              <p className="text-sm font-mono break-all">{sessionId}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(createPageUrl("UserProfile") + `?username=${new URLSearchParams(window.location.search).get('username') || ''}`)}
              className="flex-1"
              variant="outline"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View My Bookings
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Discover"))}
              className="flex-1 cu-button"
            >
              Browse More Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}