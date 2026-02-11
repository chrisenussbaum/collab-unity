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
import { Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const VIDEO_PLATFORMS = {
  meet: {
    name: 'Google Meet',
    color: 'bg-green-600',
    icon: '📹',
    createUrl: 'https://meet.google.com/new',
    instructions: 'Click "Create Meeting" below to open Google Meet in a new tab. Copy the meeting link and paste it here.',
    placeholder: 'https://meet.google.com/xxx-xxxx-xxx'
  },
  zoom: {
    name: 'Zoom',
    color: 'bg-blue-600',
    icon: '🎥',
    createUrl: 'https://zoom.us/start/videomeeting',
    instructions: 'Click "Create Meeting" below to start a Zoom meeting. Copy the meeting link and paste it here.',
    placeholder: 'https://zoom.us/j/...'
  },
  teams: {
    name: 'Microsoft Teams',
    color: 'bg-purple-600',
    icon: '💼',
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
      icon: platform.icon
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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleSelectPlatform('meet')}>
            <span className="mr-2 text-lg">{VIDEO_PLATFORMS.meet.icon}</span>
            {VIDEO_PLATFORMS.meet.name}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectPlatform('zoom')}>
            <span className="mr-2 text-lg">{VIDEO_PLATFORMS.zoom.icon}</span>
            {VIDEO_PLATFORMS.zoom.name}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectPlatform('teams')}>
            <span className="mr-2 text-lg">{VIDEO_PLATFORMS.teams.icon}</span>
            {VIDEO_PLATFORMS.teams.name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{platform?.icon}</span>
              Start {platform?.name} Call
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">{platform?.instructions}</p>
              <Button
                onClick={handleCreateMeeting}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Create Meeting
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Meeting Link
              </label>
              <Input
                placeholder={platform?.placeholder}
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStartCall();
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartCall}
                disabled={!meetingLink.trim()}
                className="flex-1 cu-button"
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