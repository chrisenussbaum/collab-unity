import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Code, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function CodeProjectPreview({ project }) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (!project?.files) return;

    const htmlFile = project.files.find(f => f.language === 'html');
    const cssFile = project.files.find(f => f.language === 'css');
    const jsFile = project.files.find(f => f.language === 'javascript');

    let htmlContent = htmlFile?.content || '<body style="padding: 20px; font-family: Arial;">No HTML content available</body>';
    
    // Inject CSS
    if (cssFile) {
      const cssTag = `<style>${cssFile.content}</style>`;
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${cssTag}</head>`);
      } else {
        htmlContent = `${cssTag}${htmlContent}`;
      }
    }

    // Inject JS
    if (jsFile) {
      const jsTag = `<script>${jsFile.content}</script>`;
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${jsTag}</body>`);
      } else {
        htmlContent = `${htmlContent}${jsTag}`;
      }
    }

    setPreviewHtml(htmlContent);
  }, [project]);

  if (!project) return null;

  return (
    <>
      <Card className="cu-card overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2 text-white">
            <Code className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Interactive Preview</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFullscreen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            Fullscreen
          </Button>
        </div>
        <div className="relative w-full bg-white" style={{ height: '400px' }}>
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            title={`Preview: ${project.title}`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            This is a live, interactive preview of the code project
          </p>
        </div>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0">
          <div className="flex flex-col h-full">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-2 text-white">
                <Code className="w-5 h-5 text-purple-400" />
                <span className="font-medium">{project.title}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFullscreen(false)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </Button>
            </div>
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                title={`Fullscreen: ${project.title}`}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}