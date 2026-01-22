import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

export default function ServiceCardSkeleton() {
  return (
    <Card className="cu-card overflow-hidden animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          {/* Provider avatar skeleton */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
          
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title skeleton */}
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            {/* Provider name skeleton */}
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
        
        {/* Badges skeleton */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Rate skeleton */}
        <div className="h-8 bg-gray-200 rounded w-32" />

        {/* Skills skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-18" />
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 border-t p-4">
        <div className="flex gap-2 w-full">
          <div className="h-9 bg-gray-200 rounded flex-1" />
          <div className="h-9 bg-gray-200 rounded flex-1" />
        </div>
      </CardFooter>
    </Card>
  );
}