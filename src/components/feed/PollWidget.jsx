import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Check, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PollWidget({ post, currentUser }) {
  const [pollOptions, setPollOptions] = useState(post.poll_options || []);
  const [isActive, setIsActive] = useState(post.is_poll_active !== false);
  const [isVoting, setIsVoting] = useState(false);

  const userVoteIndex = pollOptions.findIndex(opt =>
    opt.voter_emails?.includes(currentUser?.email)
  );
  const hasVoted = userVoteIndex >= 0;

  const totalVotes = pollOptions.reduce((sum, opt) =>
    sum + (opt.voter_emails?.length || 0), 0
  );

  const isOwner = currentUser && post.created_by === currentUser.email;

  const handleVote = async (optionIndex) => {
    if (!currentUser || !isActive || hasVoted || isVoting) return;
    setIsVoting(true);

    const updatedOptions = pollOptions.map((opt, i) => {
      if (i === optionIndex) {
        return {
          ...opt,
          voter_emails: [...(opt.voter_emails || []), currentUser.email]
        };
      }
      return opt;
    });

    setPollOptions(updatedOptions);

    try {
      await base44.entities.FeedPost.update(post.id, { poll_options: updatedOptions });
    } catch (error) {
      console.error("Error voting:", error);
      setPollOptions(post.poll_options || []);
      toast.error("Failed to register vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleClosePoll = async () => {
    try {
      await base44.entities.FeedPost.update(post.id, { is_poll_active: false });
      setIsActive(false);
      toast.success("Poll closed");
    } catch (error) {
      toast.error("Failed to close poll");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-600">
            {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          </span>
          {!isActive && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" /> Closed
            </Badge>
          )}
        </div>
        {isOwner && isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClosePoll}
            className="text-xs text-gray-500 hover:text-gray-700 h-7"
          >
            Close Poll
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {pollOptions.map((option, index) => {
          const voteCount = option.voter_emails?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isUserChoice = userVoteIndex === index;

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={!isActive || hasVoted || !currentUser || isVoting}
              className={`w-full text-left relative overflow-hidden rounded-lg border-2 transition-all ${
                isUserChoice
                  ? "border-purple-500"
                  : hasVoted
                  ? "border-gray-200"
                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              } ${(!isActive || hasVoted || !currentUser) ? "cursor-default" : "cursor-pointer"}`}
            >
              {hasVoted && (
                <div
                  className={`absolute inset-0 transition-all ${isUserChoice ? "bg-purple-100" : "bg-gray-100"}`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  {isUserChoice && <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                  <span className="text-sm font-medium text-gray-900">{option.text}</span>
                </div>
                {hasVoted && (
                  <span className="text-sm font-semibold text-purple-600 flex-shrink-0 ml-2">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!currentUser && (
        <p className="text-xs text-gray-500 text-center">Sign in to vote</p>
      )}
    </div>
  );
}