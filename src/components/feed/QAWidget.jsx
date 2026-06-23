import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";

export default function QAWidget({ post, currentUser }) {
  const [answers, setAnswers] = useState(post.qa_answers || []);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!currentUser || !answerText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const newAnswer = {
      content: answerText.trim(),
      answered_by_email: currentUser.email,
      answered_by_name: currentUser.full_name || currentUser.email,
      answered_by_profile_image: currentUser.profile_image || "",
      created_date: new Date().toISOString()
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setAnswerText("");

    try {
      await base44.entities.FeedPost.update(post.id, { qa_answers: updatedAnswers });
      toast.success("Answer posted!");
    } catch (error) {
      console.error("Error posting answer:", error);
      setAnswers(post.qa_answers || []);
      setAnswerText(answerText);
      toast.error("Failed to post answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-600">
          {answers.length} {answers.length === 1 ? "answer" : "answers"}
        </span>
      </div>

      {answers.length > 0 && (
        <div className="space-y-3">
          {answers.map((answer, index) => (
            <div key={index} className="flex gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <OptimizedAvatar
                src={answer.answered_by_profile_image}
                alt={answer.answered_by_name}
                fallback={answer.answered_by_name?.[0] || 'U'}
                size="xs"
                className="w-8 h-8 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{answer.answered_by_name}</span>
                  <span className="text-xs text-gray-500">
                    {answer.created_date ? formatDistanceToNow(new Date(answer.created_date)) + ' ago' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{answer.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {answers.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">Be the first to answer!</p>
      )}

      {currentUser ? (
        <div className="space-y-2">
          <Textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Share your answer..."
            rows={3}
            className="resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{answerText.length}/500</span>
            <Button
              onClick={handleSubmitAnswer}
              disabled={!answerText.trim() || isSubmitting}
              size="sm"
              className="cu-button"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              {isSubmitting ? "Posting..." : "Answer"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center">Sign in to answer</p>
      )}
    </div>
  );
}