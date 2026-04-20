import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function MyBookings() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Service bookings have been removed from this platform.</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">This feature is no longer available.</p>
          <Link to={createPageUrl("Discover")}>
            <Button className="cu-button">Discover Projects</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}