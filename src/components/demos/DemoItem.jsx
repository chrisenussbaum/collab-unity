import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Demo, DemoApplaud, Comment, Notification, Project } from "@/entities/all";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  HandHeart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import FeedComments from "@/components/FeedComments";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import DemoVideo from "@/components/demos/DemoVideo";
import { renderContentWithMentions } from "@/lib/mentions";

const formatCount = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

export default function DemoItem({
  demo,
  owner,
  currentUser,
  demoApplauds,
  onDemoDeleted,
  onApplaudUpdate,
}) {
  const [isApplauded, setIsApplauded] = useState(false);
  const [applaudCount, setApplaudCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [relatedProject, setRelatedProject] = useState(null);
  const commentsRef = useRef(null);

  const isOwner = currentUser && demo.created_by === currentUser.email;

  useEffect(() => {
    const a = demoApplauds.filter((x) => x.demo_id === demo.id);
    setApplaudCount(a.length);
    setIsApplauded(currentUser ? a.some((x) => x.user_email === currentUser.email) : false);
  }, [demoApplauds, demo.id, currentUser]);

  useEffect(() => {
    if (demo.related_project_id) {
      Project.get(demo.related_project_id).then(setRelatedProject).catch(() => {});
    } else {
      setRelatedProject(null);
    }
  }, [demo.related_project_id]);

  const handleApplaud = async () => {
    if (!currentUser) return;
    const was = isApplauded;
    const prev = applaudCount;
    setIsApplauded(!was);
    setApplaudCount(was ? prev - 1 : prev + 1);
    try {
      if (was) {
        const a = demoApplauds.find(
          (x) => x.demo_id === demo.id && x.user_email === currentUser.email
        );
        if (a) {
          await DemoApplaud.delete(a.id);
          if (onApplaudUpdate) onApplaudUpdate();
        }
      } else {
        await DemoApplaud.create({
          demo_id: demo.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
        });
        if (demo.created_by !== currentUser.email) {
          Notification.create({
            user_email: demo.created_by,
            title: "Someone applauded your demo!",
            message: `${currentUser.full_name || currentUser.email} applauded your demo.`,
            type: "feed_applaud",
            related_project_id: demo.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
          }).catch(() => {});
        }
        if (onApplaudUpdate) onApplaudUpdate();
      }
    } catch {
      setIsApplauded(was);
      setApplaudCount(prev);
      toast.error("Failed to update applaud.");
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    try {
      const a = demoApplauds.filter((x) => x.demo_id === demo.id);
      for (const x of a) await DemoApplaud.delete(x.id);
      const comments = await Comment.filter({ project_id: demo.id, context: "demo" });
      for (const c of comments) await Comment.delete(c.id);
      await Demo.delete(demo.id);
      setShowDeleteConfirm(false);
      if (onDemoDeleted) onDemoDeleted();
    } catch {
      toast.error("Failed to delete demo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const profileUrl = owner?.username
    ? createPageUrl(`UserProfile?username=${owner.username}`)
    : createPageUrl(`UserProfile?email=${owner?.email}`);
  const handle = owner?.username ? `@${owner.username}` : owner?.full_name || (demo.created_by ? demo.created_by.split("@")[0] : "User");
  const longCaption = (demo.caption || "").length > 120;

  return (
    <>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Demo"
        description="Delete this demo? This cannot be undone."
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <div className="cu-card mb-6 overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3">
          <Link to={profileUrl} className="flex items-center gap-3 min-w-0">
            <OptimizedAvatar
              src={owner?.profile_image}
              alt={handle}
              fallback={handle[0] || "U"}
              size="default"
              className="w-9 h-9 border-2 border-gray-100 shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-900 truncate">{handle}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(demo.created_date))} ago
                </span>
              </div>
              {owner?.full_name && owner?.username && (
                <span className="text-xs text-gray-500 truncate block">{owner.full_name}</span>
              )}
            </div>
          </Link>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Demo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Media */}
        <div className="bg-black">
          {demo.media_type === "video" ? (
            <DemoVideo
              src={demo.media_url}
              poster={demo.thumbnail_url || undefined}
              className="w-full max-h-[80vh] object-contain bg-black"
            />
          ) : (
            <img
              src={demo.media_url}
              alt={demo.caption || "demo"}
              className="w-full max-h-[80vh] object-contain bg-black"
            />
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-1 px-3 sm:px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 hover:bg-transparent ${
              isApplauded ? "text-purple-600" : "text-gray-800 hover:text-purple-600"
            }`}
            onClick={handleApplaud}
          >
            <HandHeart className={`w-6 h-6 ${isApplauded ? "fill-current" : ""}`} />
            {applaudCount > 0 && (
              <span className="text-sm font-semibold">{formatCount(applaudCount)}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-800 hover:text-purple-600 hover:bg-transparent"
            onClick={() => commentsRef.current?.toggle()}
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <div className="flex-1" />
        </div>

        {/* Caption */}
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-sm text-gray-800 leading-relaxed">
            <Link to={profileUrl} className="font-semibold mr-1.5 hover:text-purple-600">
              {handle}
            </Link>
            <span className={expanded ? "" : "line-clamp-2"}>
              {renderContentWithMentions(demo.caption || "")}
            </span>
            {longCaption && !expanded && (
              <button onClick={() => setExpanded(true)} className="text-gray-400 ml-1">
                ... more
              </button>
            )}
            {longCaption && expanded && (
              <button onClick={() => setExpanded(false)} className="text-gray-400 ml-1">
                less
              </button>
            )}
          </p>
          {relatedProject && (
            <Link
              to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}
              className="mt-2 inline-flex items-center gap-2 text-xs bg-purple-50 border border-purple-100 rounded-full px-3 py-1.5 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              {relatedProject.logo_url ? (
                <img src={relatedProject.logo_url} className="w-4 h-4 rounded object-cover" alt="" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5" />
              )}
              <span className="font-medium truncate max-w-[200px]">{relatedProject.title}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="px-3 sm:px-4 pb-3">
          <FeedComments
            ref={commentsRef}
            project={{
              id: demo.id,
              title: demo.caption || "your demo",
              created_by: demo.created_by,
            }}
            currentUser={currentUser}
            context="demo"
          />
        </div>
      </div>
    </>
  );
}