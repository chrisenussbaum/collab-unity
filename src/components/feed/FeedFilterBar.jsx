import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";

const formatLabel = (str) => {
  if (!str) return '';
  return String(str).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function FeedFilterBar({
  filterOptions,
  filterIndustry, setFilterIndustry,
  filterArea, setFilterArea,
  filterType, setFilterType,
  filterStatus, setFilterStatus,
  filterSkill, setFilterSkill,
  hasActiveFilters, onClearFilters
}) {
  if (!filterOptions) return null;
  const hasOptions = filterOptions.industries.length > 0 || filterOptions.areas.length > 0 || filterOptions.types.length > 0 || filterOptions.statuses.length > 0 || filterOptions.skills.length > 0;
  if (!hasOptions) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center text-xs text-gray-500 font-medium gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        {filterOptions.statuses.length > 0 && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-40 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Statuses</SelectItem>
              {filterOptions.statuses.map(s => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.types.length > 0 && (
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue placeholder="Project Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Types</SelectItem>
              {filterOptions.types.map(t => (
                <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.industries.length > 0 && (
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Industries</SelectItem>
              {filterOptions.industries.map(ind => (
                <SelectItem key={ind} value={ind}>{formatLabel(ind)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.areas.length > 0 && (
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="h-8 text-xs w-40 bg-white">
              <SelectValue placeholder="Area of Interest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Areas</SelectItem>
              {filterOptions.areas.map(a => (
                <SelectItem key={a} value={a}>{formatLabel(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.skills.length > 0 && (
          <Select value={filterSkill} onValueChange={setFilterSkill}>
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Skills</SelectItem>
              {filterOptions.skills.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-xs text-gray-500 hover:text-red-500 px-2">
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}