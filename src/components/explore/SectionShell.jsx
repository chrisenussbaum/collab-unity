import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionShell({ icon: Icon, title, seeAllTo, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {seeAllTo && (
          <Link to={seeAllTo} className="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 flex-shrink-0">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export function Empty({ label }) {
  return <div className="text-sm text-gray-400 py-8 text-center">{label}</div>;
}