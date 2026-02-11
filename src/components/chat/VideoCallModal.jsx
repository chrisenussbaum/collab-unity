import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';

export default function VideoCallModal({ isOpen, onClose, roomUrl, userName }) {
  const callFrameRef = useRef(null);
  const containerRef = useRef(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen || !roomUrl) {
      return;
    }

    const initializeCall = async () => {
      try {
        // Create Daily call frame
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px'
          },
          showLeaveButton: true,
          showFullscreenButton: true
        });

        callFrameRef.current = callFrame;

        // Join the call
        await callFrame.join({ 
          url: roomUrl,
          userName: userName || 'User'
        });

        setIsCallActive(true);

        // Handle call events
        callFrame
          .on('left-meeting', () => {
            setIsCallActive(false);
            onClose();
          })
          .on('error', (error) => {
            console.error('Daily call error:', error);
            setIsCallActive(false);
          });

      } catch (error) {
        console.error('Failed to initialize video call:', error);
        onClose();
      }
    };

    initializeCall();

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [isOpen, roomUrl, userName]);

  const handleLeaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
    onClose();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0">
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
          {/* Video call container */}
          <div ref={containerRef} className="w-full h-full" />

          {/* Controls overlay */}
          {isCallActive && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-4 py-3 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 rounded-full"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleLeaveCall}
                className="rounded-full bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}