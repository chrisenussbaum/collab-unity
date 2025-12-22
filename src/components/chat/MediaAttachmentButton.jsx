import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Paperclip, Image, Video, File, Loader2 } from "lucide-react";

export default function MediaAttachmentButton({ onMediaSelect, isUploading, disabled }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      onMediaSelect(file, type);
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        onChange={(e) => handleFileChange(e, 'video')}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'file')}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={disabled || isUploading}
            className="text-gray-500 hover:text-purple-600"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
            <Image className="w-4 h-4 mr-2" />
            Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
            <Video className="w-4 h-4 mr-2" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <File className="w-4 h-4 mr-2" />
            File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}