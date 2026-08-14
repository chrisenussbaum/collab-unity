import { base44 } from "@/api/base44Client";
import {
  optimizeImage, validateVideo, isImageFile, isVideoFile,
} from "@/components/mediaOptimization";

const MAX_DISPLAY_WIDTH = 420;

// Generates a JPEG thumbnail File from a video blob (client-side).
function generateVideoThumbnailFromBlob(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const videoURL = URL.createObjectURL(videoFile);
    video.src = videoURL;

    let hasGenerated = false;
    const cleanup = () => URL.revokeObjectURL(videoURL);

    const generateThumbnail = () => {
      if (hasGenerated) return;
      hasGenerated = true;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanup();
          if (blob) resolve(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
          else reject(new Error("Canvas toBlob failed"));
        }, "image/jpeg", 0.9);
      } catch (err) {
        cleanup();
        reject(new Error("Error drawing video frame: " + err.message));
      }
    };

    video.addEventListener("loadedmetadata", () => {
      if (video.readyState >= 2) video.currentTime = Math.min(0.5, (video.duration || 1) * 0.05);
    });
    video.addEventListener("loadeddata", () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        video.currentTime = Math.min(0.5, (video.duration || 1) * 0.05);
      } else { cleanup(); reject(new Error("Video has invalid dimensions")); }
    });
    video.addEventListener("seeked", generateThumbnail);
    video.addEventListener("error", () => { cleanup(); reject(new Error("Failed to load video")); });
    setTimeout(() => {
      if (!hasGenerated && video.readyState >= 2) generateThumbnail();
      else if (!hasGenerated) { cleanup(); reject(new Error("Video thumbnail timeout")); }
    }, 10000);
    video.load();
  });
}

const fitWidth = (w, h) => {
  if (!w || !h) return { w: 320, h: 240 };
  if (w > MAX_DISPLAY_WIDTH) return { w: MAX_DISPLAY_WIDTH, h: Math.round(h * MAX_DISPLAY_WIDTH / w) };
  return { w: Math.round(w), h: Math.round(h) };
};

// Validates, optimizes and uploads an image or video file, returning the
// annotation payload (type, width, height, data) ready for createAnno().
// Uses the same 50MB / 5-min video limit the rest of the app enforces.
export async function prepareCanvasMedia(file, onProgress) {
  if (!file) throw new Error("No file provided");

  if (isImageFile(file)) {
    onProgress?.("Optimizing image...");
    const optimized = await optimizeImage(file);
    onProgress?.("Uploading image...");
    const { file_url } = await base44.integrations.Core.UploadFile({ file: optimized });
    const dims = await new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res({ w: 0, h: 0 });
      img.src = file_url;
    });
    const { w, h } = fitWidth(dims.w, dims.h);
    return {
      type: "image",
      width: w, height: h,
      data: { src: file_url, borderColor: "#18A0FB", borderWidth: 2 },
    };
  }

  if (isVideoFile(file)) {
    onProgress?.("Validating video...");
    const info = await validateVideo(file, { maxSizeMB: 50, maxDurationSeconds: 300 });
    onProgress?.("Generating thumbnail...");
    let thumbnail_url = null;
    try {
      const thumb = await generateVideoThumbnailFromBlob(file);
      const up = await base44.integrations.Core.UploadFile({ file: thumb });
      thumbnail_url = up.file_url;
    } catch (e) { /* continue without thumbnail */ }
    onProgress?.("Uploading video...");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const { w, h } = fitWidth(info.width, info.height);
    return {
      type: "video",
      width: w, height: h,
      data: { src: file_url, thumbnail_url, borderColor: "#18A0FB", borderWidth: 2 },
    };
  }

  throw new Error("Unsupported file type. Please drop an image or video file.");
}