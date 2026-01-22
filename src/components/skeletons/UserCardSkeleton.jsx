import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function UserCardSkeleton() {
  return (
    <Card className="cu-card overflow-hidden animate-pulse">
      <CardHeader className="pb-4">
        <div className="flex flex-col items-center text-center">
          {/* Avatar skeleton */}
          <div className="w-20 h-20 rounded-full bg-gray-200 mb-3" />
          
          {/* Name skeleton */}
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          
          {/* Username skeleton */}
          <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
          
          {/* Badges skeleton */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-3">
        {/* Bio skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Location skeleton */}
        <div className="h-4 bg-gray-200 rounded w-28" />

        {/* Skills skeleton */}
        <div className="flex flex-wrap gap-1.5">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
          <div className="h-5 bg-gray-200 rounded-full w-14" />
        </div>

        {/* Button skeleton */}
        <div className="h-9 bg-gray-200 rounded w-full mt-4" />
      </CardContent>
    </Card>
  );
}