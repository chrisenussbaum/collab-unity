import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Video, ExternalLink, Camera, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const VIDEO_PLATFORMS = {
  meet: {
    name: 'Google Meet',
    color: 'bg-green-600',
    icon: Camera,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    createUrl: 'https://meet.google.com/new',
    instructions: 'Click "Create Meeting" below to open Google Meet in a new tab. Copy the meeting link and paste it here.',
    placeholder: 'https://meet.google.com/xxx-xxxx-xxx'
  },
  zoom: {
    name: 'Zoom',
    color: 'bg-blue-600',
    icon: Video,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    createUrl: 'https://zoom.us/start/videomeeting',
    instructions: 'Click "Create Meeting" below to start a Zoom meeting. Copy the meeting link and paste it here.',
    placeholder: 'https://zoom.us/j/...'
  },
  teams: {
    name: 'Microsoft Teams',
    color: 'bg-purple-600',
    icon: Users,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    createUrl: 'https://teams.microsoft.com/l/meeting/new',
    instructions: 'Click "Create Meeting" below to create a Teams meeting. Copy the meeting link and paste it here.',
    placeholder: 'https://teams.microsoft.com/l/meetup-join/...'
  }
};

export default function VideoCallButton({ onStartCall, disabled }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');

  const handleSelectPlatform = (platformKey) => {
    setSelectedPlatform(platformKey);
    setMeetingLink('');
    setShowDialog(true);
  };

  const handleCreateMeeting = () => {
    const platform = VIDEO_PLATFORMS[selectedPlatform];
    window.open(platform.createUrl, '_blank');
  };

  const handleStartCall = () => {
    if (!meetingLink.trim()) {
      toast.error('Please enter a meeting link');
      return;
    }

    // Basic URL validation
    if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
      toast.error('Please enter a valid meeting URL');
      return;
    }

    const platform = VIDEO_PLATFORMS[selectedPlatform];
    onStartCall({
      platform: platform.name,
      link: meetingLink.trim(),
      platformKey: selectedPlatform,
      iconColor: platform.iconColor,
      bgColor: platform.bgColor,
      borderColor: platform.borderColor
    });

    setShowDialog(false);
    setSelectedPlatform(null);
    setMeetingLink('');
  };

  const platform = selectedPlatform ? VIDEO_PLATFORMS[selectedPlatform] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="text-gray-600 hover:text-purple-600"
            title="Start video call"
          >
            <Video className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem 
            onClick={() => handleSelectPlatform('meet')}
            className="py-3 cursor-pointer"
          >
            <div className={`w-10 h-10 ${VIDEO_PLATFORMS.meet.bgColor} rounded-lg flex items-center justify-center mr-3`}>
              {React.createElement(VIDEO_PLATFORMS.meet.icon, { 
                className: `w-5 h-5 ${VIDEO_PLATFORMS.meet.iconColor}` 
              })}
            </div>
            <span className="font-medium">{VIDEO_PLATFORMS.meet.name}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSelectPlatform('zoom')}
            className="py-3 cursor-pointer"
          >
            <div className={`w-10 h-10 ${VIDEO_PLATFORMS.zoom.bgColor} rounded-lg flex items-center justify-center mr-3`}>
              {React.createElement(VIDEO_PLATFORMS.zoom.icon, { 
                className: `w-5 h-5 ${VIDEO_PLATFORMS.zoom.iconColor}` 
              })}
            </div>
            <span className="font-medium">{VIDEO_PLATFORMS.zoom.name}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSelectPlatform('teams')}
            className="py-3 cursor-pointer"
          >
            <div className={`w-10 h-10 ${VIDEO_PLATFORMS.teams.bgColor} rounded-lg flex items-center justify-center mr-3`}>
              {React.createElement(VIDEO_PLATFORMS.teams.icon, { 
                className: `w-5 h-5 ${VIDEO_PLATFORMS.teams.iconColor}` 
              })}
            </div>
            <span className="font-medium">{VIDEO_PLATFORMS.teams.name}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className={`w-12 h-12 ${platform?.bgColor} rounded-xl flex items-center justify-center`}>
                {platform && React.createElement(platform.icon, { 
                  className: `w-6 h-6 ${platform.iconColor}` 
                })}
              </div>
              Start {platform?.name} Call
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className={`${platform?.bgColor} ${platform?.borderColor} border-2 p-5 rounded-xl`}>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{platform?.instructions}</p>
              <Button
                onClick={handleCreateMeeting}
                className={`w-full ${platform?.buttonColor} text-white font-medium py-2.5`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Create Meeting
              </Button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">
                Meeting Link
              </label>
              <Input
                placeholder={platform?.placeholder}
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && meetingLink.trim()) {
                    handleStartCall();
                  }
                }}
                className="text-base py-2.5"
              />
              <p className="text-xs text-gray-500">
                Paste the meeting link from {platform?.name} here
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1 py-2.5 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartCall}
                disabled={!meetingLink.trim()}
                className={`flex-1 py-2.5 font-medium ${platform?.buttonColor} text-white`}
              >
                Share Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}