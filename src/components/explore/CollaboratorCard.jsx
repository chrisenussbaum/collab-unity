import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OptimizedAvatar from "../OptimizedAvatar";

export default function CollaboratorCard({ user }) {
  return (
    <Link
      to={createPageUrl(`UserProfile?username=${user.username}`)}
      className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <OptimizedAvatar
        src={user.profile_image}
        alt={user.full_name}
        fallback={(user.full_name || "U")[0]}
        size="sm"
        className="w-12 h-12"
      />
      <p className="mt-1.5 text-xs font-medium text-gray-800 truncate w-full group-hover:text-purple-700">{user.full_name}</p>
      <p className="text-[10px] text-gray-500 truncate w-full">{(user.skills && user.skills[0]) || "Creator"}</p>
    </Link>
  );
}