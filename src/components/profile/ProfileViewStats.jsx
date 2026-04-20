import React from "react";
import { Eye, FolderOpen } from "lucide-react";

export default function ProfileViewStats({ profileViews = 0, projectViews = 0 }) {
  return (
    <div className="flex items-center gap-4 mt-2">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Eye className="w-4 h-4 text-purple-400" />
        <span className="font-medium text-gray-700">{profileViews.toLocaleString()}</span>
        <span>Profile Views</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <FolderOpen className="w-4 h-4 text-purple-400" />
        <span className="font-medium text-gray-700">{projectViews.toLocaleString()}</span>
        <span>Project Views</span>
      </div>
    </div>
  );
}