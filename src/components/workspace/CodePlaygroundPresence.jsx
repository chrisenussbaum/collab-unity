import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from 'lucide-react';

// Generate a consistent color for a user based on their email
export const getUserColor = (email) => {
  const colors = [
    { bg: '#EF4444', text: '#FFFFFF', name: 'red' },
    { bg: '#F59E0B', text: '#FFFFFF', name: 'amber' },
    { bg: '#10B981', text: '#FFFFFF', name: 'emerald' },
    { bg: '#3B82F6', text: '#FFFFFF', name: 'blue' },
    { bg: '#8B5CF6', text: '#FFFFFF', name: 'violet' },
    { bg: '#EC4899', text: '#FFFFFF', name: 'pink' },
    { bg: '#06B6D4', text: '#FFFFFF', name: 'cyan' },
    { bg: '#84CC16', text: '#FFFFFF', name: 'lime' },
  ];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export default function CodePlaygroundPresence({ 
  collaborators, 
  currentUser,
  activeFile 
}) {
  const onlineCollaborators = collaborators.filter(c => c.isOnline && c.email !== currentUser?.email);
  
  return (
    <div className="flex items-center gap-2">
      {/* Current User */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Avatar className="w-7 h-7 ring-2 ring-green-400 ring-offset-1">
                <AvatarImage src={currentUser?.profile_image} className="object-cover" />
                <AvatarFallback 
                  className="text-xs"
                  style={{ 
                    backgroundColor: getUserColor(currentUser?.email || '').bg,
                    color: getUserColor(currentUser?.email || '').text 
                  }}
                >
                  {currentUser?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Circle className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">You</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Online Collaborators */}
      {onlineCollaborators.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center -space-x-1.5">
            <TooltipProvider>
              {onlineCollaborators.slice(0, 4).map((collab) => {
                const userColor = getUserColor(collab.email);
                return (
                  <Tooltip key={collab.email}>
                    <TooltipTrigger asChild>
                      <div className="relative cursor-pointer">
                        <Avatar 
                          className="w-7 h-7 ring-2 ring-offset-1"
                          style={{ 
                            '--tw-ring-color': userColor.bg 
                          }}
                        >
                          <AvatarImage src={collab.profile_image} className="object-cover" />
                          <AvatarFallback 
                            className="text-xs"
                            style={{ 
                              backgroundColor: userColor.bg,
                              color: userColor.text 
                            }}
                          >
                            {collab.full_name?.[0] || collab.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Circle 
                          className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" 
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="text-xs">
                        <p className="font-medium">{collab.full_name || collab.email}</p>
                        {collab.activeFile && (
                          <p className="text-gray-400">Editing: {collab.activeFile}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
            
            {onlineCollaborators.length > 4 && (
              <Badge variant="secondary" className="text-xs h-7 px-1.5 ml-1">
                +{onlineCollaborators.length - 4}
              </Badge>
            )}
          </div>
        </>
      )}

      {onlineCollaborators.length > 0 && (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          {onlineCollaborators.length + 1} online
        </Badge>
      )}
    </div>
  );
}