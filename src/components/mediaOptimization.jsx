/**
 * Utility functions for client-side media optimization
 * Resizes and compresses images and videos before upload
 */

/**
 * Resizes and compresses an image file
 * @param {File} file - The image file to optimize
 * @param {Object} options - Optimization options
 * @returns {Promise<File>} - Optimized image file
 */
export async function optimizeImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    type = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }
            
            // Create new file from blob
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
              {
                type,
                lastModified: Date.now()
              }
            );
            
            console.log(`Image optimized: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(optimizedFile);
          },
          type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and optionally compresses a video file
 * @param {File} file - The video file to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation result with file info
 */
export async function validateVideo(file, options = {}) {
  const {
    maxSizeMB = 50, // Max 50MB for videos
    maxDurationSeconds = 300 // Max 5 minutes (300 seconds) - reasonable for 50MB
  } = options;

  return new Promise((resolve, reject) => {
    // Check file size FIRST - before loading video
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      reject(new Error(`Video file is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${maxSizeMB}MB. Please compress your video or use a shorter clip.`));
      return;
    }

    // Create video element to check duration and dimensions
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      // Check duration
      const durationMinutes = Math.floor(video.duration / 60);
      const durationSeconds = Math.floor(video.duration % 60);
      const durationText = durationMinutes > 0 
        ? `${durationMinutes}m ${durationSeconds}s` 
        : `${durationSeconds}s`;
      
      if (video.duration > maxDurationSeconds) {
        const maxMinutes = Math.floor(maxDurationSeconds / 60);
        reject(new Error(`Video is too long (${durationText}). Maximum duration is ${maxMinutes} minutes for a 50MB file limit.`));
        return;
      }
      
      resolve({
        file,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        sizeMB: fileSizeMB,
        isValid: true
      });
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata. Please ensure the file is a valid video format (MP4, MOV, or AVI).'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Checks if a file is an image
 * @param {File} file - File to check
 * @returns {boolean}
 */
export function isImageFile(file) {
  return file && file.type.startsWith('image/');
}

/**
 * Checks if a file is a video
 * @param {File} file - File to check
 * @returns {boolean}
 */
export function isVideoFile(file) {
  return file && file.type.startsWith('video/');
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}