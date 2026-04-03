import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Ensure user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { video_url } = await req.json();
        
        if (!video_url) {
            return Response.json({ error: 'video_url is required' }, { status: 400 });
        }

        // Create a canvas element to extract video frame
        // Note: This is a simplified example. In production, you might want to use
        // a dedicated video processing service or library
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 20px; background: #f0f0f0; }
                video { max-width: 100%; height: auto; }
                canvas { max-width: 100%; height: auto; border: 1px solid #ccc; }
            </style>
        </head>
        <body>
            <h3>Video Thumbnail Generator</h3>
            <video id="video" crossorigin="anonymous" muted>
                <source src="${video_url}" type="video/mp4">
            </video>
            <canvas id="canvas" style="display: none;"></canvas>
            <img id="thumbnail" alt="Generated thumbnail" style="display: none;">
            <div id="status">Loading video...</div>
            
            <script>
                const video = document.getElementById('video');
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                const thumbnail = document.getElementById('thumbnail');
                const status = document.getElementById('status');

                video.addEventListener('loadedmetadata', function() {
                    status.textContent = 'Video loaded. Generating thumbnail...';
                    
                    // Set canvas dimensions to match video
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    // Seek to 1 second or 10% of video duration, whichever is smaller
                    const seekTime = Math.min(1, video.duration * 0.1);
                    video.currentTime = seekTime;
                });

                video.addEventListener('seeked', function() {
                    // Draw the current frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Convert canvas to blob
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        thumbnail.src = url;
                        thumbnail.style.display = 'block';
                        status.innerHTML = 'Thumbnail generated! <a href="' + url + '" download="thumbnail.png">Download</a>';
                    }, 'image/png');
                });

                video.addEventListener('error', function(e) {
                    status.textContent = 'Error loading video: ' + e.message;
                });

                // Load the video
                video.load();
            </script>
        </body>
        </html>
        `;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('Error in generateVideoThumbnail:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});