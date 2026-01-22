import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

export default function ProjectCardSkeleton() {
  return (
    <Card className="cu-card overflow-hidden border-t-4 border-gray-200 animate-pulse">
      <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Logo skeleton */}
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title skeleton */}
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              {/* Owner info skeleton */}
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-gray-200" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-gray-200" />
            <div className="w-9 h-9 rounded-md bg-gray-200" />
          </div>
        </div>
        
        {/* Badges skeleton */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 pt-2 space-y-3">
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>

        {/* Info skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>

        {/* Skills skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-18" />
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200">
        <div className="w-full flex justify-around">
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </CardFooter>
    </Card>
  );
}