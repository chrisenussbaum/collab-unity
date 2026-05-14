import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, X, FileText, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Determine preview type from file_type, file_name extension, or URL
const getPreviewType = (asset) => {
  const mime = (asset.file_type || "").toLowerCase();
  // Check file name, asset name, AND the actual URL for extension clues
  const sources = [
    asset.file_name || "",
    asset.asset_name || "",
    asset.file_url || ""
  ];
  
  // Extract extension from any of the sources (before query params)
  let ext = "";
  for (const src of sources) {
    const clean = src.split("?")[0].toLowerCase();
    const parts = clean.split(".");
    if (parts.length > 1) {
      const candidate = parts.pop();
      if (candidate.length <= 5) { ext = candidate; break; }
    }
  }

  if (mime.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg","bmp"].includes(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("video/") || ["mp4","webm","ogg","mov"].includes(ext)) return "video";
  if (mime.startsWith("audio/") || ["mp3","wav","ogg","m4a"].includes(ext)) return "audio";
  if (["txt","md","csv","json","xml","html","css","js","ts","jsx","tsx","py","sh"].includes(ext)) return "text";
  return "unsupported";
};

export default function AssetPreviewModal({ asset, onClose }) {
  if (!asset) return null;

  // Always try to detect the actual file type from URL/name, even for "link" resource types
  const previewType = getPreviewType(asset) !== "unsupported"
    ? getPreviewType(asset)
    : asset.resource_type === "link"
    ? "link"
    : "unsupported";

  const renderPreview = () => {
    switch (previewType) {
      case "image":
        return (
          <div className="flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden max-h-[65vh]">
            <img
              src={asset.file_url}
              alt={asset.asset_name}
              className="max-w-full max-h-[65vh] object-contain"
            />
          </div>
        );

      case "pdf":
        return (
          <div className="w-full rounded-lg overflow-hidden border" style={{ height: "65vh" }}>
            <iframe
              src={`${asset.file_url}#toolbar=1`}
              title={asset.asset_name}
              className="w-full h-full"
              frameBorder="0"
            />
          </div>
        );

      case "video":
        return (
          <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden">
            <video
              src={asset.file_url}
              controls
              className="max-w-full max-h-[65vh]"
            />
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
            <audio src={asset.file_url} controls className="w-full max-w-md" />
          </div>
        );

      case "text":
        return <TextPreview url={asset.file_url} />;

      case "link":
        return (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg gap-4">
            <ExternalLink className="w-12 h-12 text-blue-500" />
            <p className="text-sm text-gray-600 break-all text-center max-w-sm">{asset.file_url}</p>
            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
              <Button className="cu-button">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </Button>
            </a>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg gap-3">
            <p className="text-gray-500 text-sm">Preview not available for this file type.</p>
            <a href={asset.file_url} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download to View
              </Button>
            </a>
          </div>
        );
    }
  };

  return (
    <Dialog open={!!asset} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="truncate max-w-xs sm:max-w-lg">
              {asset.asset_name}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {asset.resource_type !== "link" && (
                <a href={asset.file_url} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 border-b pb-3 -mt-1">
          <Badge variant="secondary" className="text-xs">v{asset.version_number}</Badge>
          {asset.category && asset.category !== "Uncategorized" && (
            <Badge variant="outline" className="text-xs">{asset.category}</Badge>
          )}
          {asset.uploaded_by && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {asset.uploaded_by.split("@")[0]}
            </span>
          )}
          {asset.created_date && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(asset.created_date), { addSuffix: true })}
            </span>
          )}
          {asset.tags?.length > 0 && asset.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{tag}</Badge>
          ))}
        </div>

        {/* Version notes */}
        {asset.version_notes && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-medium text-amber-700 text-xs uppercase tracking-wide block mb-0.5">Notes</span>
              {asset.version_notes}
            </div>
          </div>
        )}

        <div className="mt-1">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Separate component to fetch and display plain-text files
function TextPreview({ url }) {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(t => { setText(t); setLoading(false); })
      .catch(() => { setText("Failed to load file content."); setLoading(false); });
  }, [url]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
      <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
      {text}
    </pre>
  );
}