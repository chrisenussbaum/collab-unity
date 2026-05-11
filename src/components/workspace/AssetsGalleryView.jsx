import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, FileText, File, Music, Code, Link as LinkIcon, Play, Eye, CheckSquare, Square, Edit, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

// Reuse same logic as AssetPreviewModal
const getPreviewType = (asset) => {
  const mime = (asset.file_type || "").toLowerCase();
  const sources = [asset.file_name || "", asset.asset_name || "", asset.file_url || ""];
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
  if (asset.resource_type === "link") return "link";
  return "other";
};

function GalleryThumbnail({ asset, onPreview }) {
  const [imgError, setImgError] = useState(false);
  const type = getPreviewType(asset);

  if (type === "image" && !imgError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
        <img
          src={asset.file_url}
          alt={asset.asset_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
          <p className="text-white/70 text-xs">Video</p>
        </div>
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="w-full h-full bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-10 h-10 text-red-400 mx-auto mb-1" />
          <p className="text-red-500 text-xs font-medium">PDF</p>
        </div>
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="w-full h-full bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-10 h-10 text-green-400 mx-auto mb-1" />
          <p className="text-green-500 text-xs font-medium">Audio</p>
        </div>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Code className="w-10 h-10 text-gray-300 mx-auto mb-1" />
          <p className="text-gray-400 text-xs font-medium">Text</p>
        </div>
      </div>
    );
  }

  if (type === "link") {
    return (
      <div className="w-full h-full bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <LinkIcon className="w-10 h-10 text-blue-400 mx-auto mb-1" />
          <p className="text-blue-500 text-xs font-medium">Link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-purple-50 flex items-center justify-center">
      <div className="text-center">
        <File className="w-10 h-10 text-purple-400 mx-auto mb-1" />
        <p className="text-purple-500 text-xs font-medium">File</p>
      </div>
    </div>
  );
}

export default function AssetsGalleryView({
  assets,
  isCollaborator,
  selectedAssetIds,
  onToggleSelect,
  onPreview,
  onEdit,
  onDelete,
}) {
  if (assets.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {assets.map((asset) => {
        const isSelected = selectedAssetIds?.has(asset.id);
        const type = getPreviewType(asset);
        const isFile = asset.resource_type !== "link";

        return (
          <div
            key={asset.id}
            className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
              isSelected ? "border-purple-500 ring-2 ring-purple-300" : "border-gray-200 hover:border-purple-300"
            }`}
          >
            {/* Thumbnail */}
            <div
              className="relative w-full"
              style={{ paddingBottom: "70%" }}
              onClick={() => onPreview(asset)}
            >
              <div className="absolute inset-0">
                <GalleryThumbnail asset={asset} onPreview={onPreview} />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                    <Eye className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Select checkbox */}
            {isCollaborator && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect(asset.id); }}
                className="absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-white/90 shadow flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100"
                data-selected={isSelected}
              >
                {isSelected
                  ? <CheckSquare className="w-4 h-4 text-purple-600" />
                  : <Square className="w-4 h-4 text-gray-400" />}
              </button>
            )}

            {/* Type badge */}
            <div className="absolute top-2 right-2 z-10">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow ${
                type === "image" ? "bg-white/90 text-gray-600" :
                type === "video" ? "bg-black/60 text-white" :
                type === "pdf" ? "bg-red-100 text-red-600" :
                type === "audio" ? "bg-green-100 text-green-600" :
                type === "link" ? "bg-blue-100 text-blue-600" :
                "bg-purple-100 text-purple-600"
              }`}>
                {type === "other" ? "file" : type}
              </span>
            </div>

            {/* Info footer */}
            <div className="p-2.5">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{asset.asset_name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    v{asset.version_number} · {formatDistanceToNow(new Date(asset.created_date), { addSuffix: true })}
                  </p>
                </div>
                {isCollaborator && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50">
                      <DropdownMenuItem onClick={() => onPreview(asset)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      {isFile ? (
                        <DropdownMenuItem onClick={() => window.open(asset.file_url, "_blank")}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => window.open(asset.file_url, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Open Link
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(asset)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(asset)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {asset.category && asset.category !== "Uncategorized" && (
                <Badge variant="secondary" className="mt-1.5 text-[10px] px-1.5 py-0">{asset.category}</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}