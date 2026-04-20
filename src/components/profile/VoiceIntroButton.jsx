import React, { useState, useRef, useEffect } from "react";
import { Volume2, Square, Mic, Loader2, Trash2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function VoiceIntroButton({ voiceIntroUrl, isOwner, onUpdate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset audio ref when voiceIntroUrl changes so the saved version always plays
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, [voiceIntroUrl]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (!voiceIntroUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(voiceIntroUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    if (isOwner) {
      setShowManageDialog(true);
    } else if (voiceIntroUrl) {
      handlePlayPause(e);
    }
  };

  const startRecording = async () => {
    chunksRef.current = [];
    setRecordingTime(0);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setRecordedBlob(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handlePreviewPlay = () => {
    if (!recordedBlob) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(URL.createObjectURL(recordedBlob));
      previewAudioRef.current.onended = () => setIsPreviewPlaying(false);
    }
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  const handleUploadRecording = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    const file = new File([recordedBlob], "voice-intro.webm", { type: "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ voice_intro_url: file_url });
    onUpdate(file_url);
    setRecordedBlob(null);
    setShowManageDialog(false);
    setIsUploading(false);
    toast.success("Voice intro saved!");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file.");
      return;
    }
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ voice_intro_url: file_url });
    onUpdate(file_url);
    setShowManageDialog(false);
    setIsUploading(false);
    toast.success("Voice intro uploaded!");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    await base44.auth.updateMe({ voice_intro_url: "" });
    onUpdate("");
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
    setShowManageDialog(false);
    toast.success("Voice intro removed.");
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Don't render at all if no voice intro and not the owner
  if (!voiceIntroUrl && !isOwner) return null;

  return (
    <>
      {/* Play button — always visible on avatar for all users */}
      <button
        onClick={handleIconClick}
        title={isOwner ? "Manage voice intro" : "Play voice intro"}
        className={`absolute bottom-0 left-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all z-10 ${
          voiceIntroUrl
            ? isPlaying
              ? "bg-purple-700 text-white animate-pulse"
              : "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
        }`}
      >
        {isPlaying ? <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </button>

      {isOwner && (
        <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Voice Intro</DialogTitle>
              <DialogDescription>
                Record or upload a short audio clip to introduce yourself on your profile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Current voice intro */}
              {voiceIntroUrl && !recordedBlob && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700 font-medium">Current voice intro</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handlePlayPause}>
                      {isPlaying ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Recording section */}
              {!recordedBlob ? (
                <div className="text-center space-y-3">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                        <Mic className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-sm font-medium text-red-600">Recording... {formatTime(recordingTime)}</p>
                      <Button onClick={stopRecording} variant="destructive" size="sm">
                        <Square className="w-4 h-4 mr-2" /> Stop Recording
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Button onClick={startRecording} className="cu-button gap-2">
                        <Mic className="w-4 h-4" /> Record Voice Intro
                      </Button>
                      <p className="text-xs text-gray-500">or</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
                        <Upload className="w-4 h-4" /> Upload Audio File
                      </Button>
                      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm text-gray-700 font-medium">Recording ready ({formatTime(recordingTime)})</span>
                    <Button size="sm" variant="outline" onClick={handlePreviewPlay}>
                      {isPreviewPlaying ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setRecordedBlob(null); previewAudioRef.current = null; }}>
                      Re-record
                    </Button>
                    <Button onClick={handleUploadRecording} disabled={isUploading} className="flex-1 cu-button">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}