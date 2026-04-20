import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function UserProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Profile Card Skeleton */}
        <Card className="cu-card mb-6 overflow-hidden">
          <CardContent className="p-0">
            {/* Cover photo */}
            <div className="h-32 sm:h-40 md:h-48 lg:h-64 bg-gray-200" />

            <div className="relative px-3 sm:px-4 md:px-6 py-6 sm:py-8">
              <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                {/* Avatar skeleton */}
                <div className="flex justify-center md:justify-start -mt-16 sm:-mt-20 md:-mt-24 mb-4 md:mb-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gray-300 border-4 border-white shadow-xl" />
                </div>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="text-center md:text-left space-y-2">
                    {/* Name */}
                    <div className="h-8 bg-gray-200 rounded w-48 mx-auto md:mx-0" />
                    {/* Username */}
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto md:mx-0" />
                    {/* Location */}
                    <div className="h-4 bg-gray-200 rounded w-40 mx-auto md:mx-0" />
                    {/* Profile views */}
                    <div className="flex gap-4 justify-center md:justify-start mt-2">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 justify-center md:justify-end">
                    <div className="h-9 bg-gray-200 rounded w-28" />
                    <div className="h-9 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Bio card */}
            <Card className="cu-card">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </CardContent>
            </Card>
            {/* Projects card */}
            <Card className="cu-card">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="h-5 bg-gray-200 rounded w-32" />
                {[1, 2].map(i => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16" />
                      <div className="h-5 bg-gray-200 rounded-full w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="cu-card">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-28" />
                <div className="h-9 bg-gray-200 rounded w-full" />
                <div className="h-9 bg-gray-200 rounded w-full" />
              </CardContent>
            </Card>
            <Card className="cu-card">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-20" />
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-6 bg-gray-200 rounded-full w-16" />)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}