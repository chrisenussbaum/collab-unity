import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ExternalLink } from 'lucide-react';

export default function CommunicationsPanel({ project, isCollaborator }) {
  const communicationTools = [
    {
      name: "Zoom",
      icon: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
      url: "https://zoom.us/start/videomeeting",
      color: "bg-transparent border border-blue-200",
      iconColor: "text-blue-600",
      description: "Start a Zoom meeting"
    },
    {
      name: "Google Meet",
      icon: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg",
      url: "https://meet.google.com/new",
      color: "bg-transparent border border-green-200",
      iconColor: "text-green-600",
      description: "Create a Google Meet"
    },
    {
      name: "Microsoft Teams",
      icon: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg",
      url: "https://teams.microsoft.com/",
      color: "bg-transparent border border-purple-200",
      iconColor: "text-purple-600",
      description: "Open Microsoft Teams"
    }
  ];

  if (!isCollaborator) {
    return (
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            Team Communications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <p className="text-sm text-gray-500 text-center py-4">
            Join as a collaborator to access video conferencing tools
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
          Team Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
        <p className="text-sm text-gray-600 mb-4">
          Quick access to video conferencing platforms for team collaboration
        </p>
        
        <div className="space-y-3">
          {communicationTools.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-gray-50 transition-colors h-auto py-3"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`${tool.color} p-2 rounded-lg flex-shrink-0`}>
                    <img 
                      src={tool.icon} 
                      alt={tool.name} 
                      className="w-5 h-5"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <Video className={`w-5 h-5 ${tool.iconColor} hidden`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm text-gray-900">{tool.name}</p>
                    <p className="text-xs text-gray-500 truncate">{tool.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </Button>
            </a>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-transparent rounded-lg border border-purple-200">
          <p className="text-xs text-purple-900">
            💡 <span className="font-semibold">Tip:</span> Share meeting links in the Discussion tab so all team members can join
          </p>
        </div>
      </CardContent>
    </Card>
  );
}