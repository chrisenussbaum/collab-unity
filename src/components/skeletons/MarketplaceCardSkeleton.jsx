import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

export default function MarketplaceCardSkeleton() {
  return (
    <Card className="cu-card overflow-hidden animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          {/* Project logo skeleton */}
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
          
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title skeleton */}
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            {/* Seller name skeleton */}
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
        
        {/* Price badge skeleton */}
        <div className="h-8 bg-gray-200 rounded-full w-24 mt-3" />
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>

        {/* Info skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-28" />
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