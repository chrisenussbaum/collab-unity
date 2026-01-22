import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

export default function FeedPostSkeleton() {
  return (
    <Card className="cu-card mb-6 overflow-hidden border-t-4 border-gray-200 animate-pulse">
      <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
        <div className="flex items-start space-x-3">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
          
          <div className="flex-1 min-w-0 space-y-2">
            {/* Post type badge skeleton */}
            <div className="h-4 bg-gray-200 rounded w-32" />
            {/* Title skeleton */}
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            {/* Author and date skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 pt-2 space-y-3">
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>

        {/* Media placeholder skeleton */}
        <div className="w-full h-64 bg-gray-200 rounded-lg" />
      </CardContent>

      <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200">
        <div className="w-full flex justify-around">
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </CardFooter>
    </Card>
  );
}