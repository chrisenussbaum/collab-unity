import React, { useState, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, Users,
  Clock, CheckCircle2, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const INSIGHT_ICONS = {
  timeline: Clock,
  bottleneck: AlertTriangle,
  resource: Users,
  positive: CheckCircle2,
  action: Zap,
  trend: TrendingUp,
};

const INSIGHT_COLORS = {
  timeline: 'text-blue-600 bg-blue-50 border-blue-200',
  bottleneck: 'text-amber-600 bg-amber-50 border-amber-200',
  resource: 'text-purple-600 bg-purple-50 border-purple-200',
  positive: 'text-green-600 bg-green-50 border-green-200',
  action: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  trend: 'text-rose-600 bg-rose-50 border-rose-200',
};

const BADGE_COLORS = {
  timeline: 'bg-blue-100 text-blue-700',
  bottleneck: 'bg-amber-100 text-amber-700',
  resource: 'bg-purple-100 text-purple-700',
  positive: 'bg-green-100 text-green-700',
  action: 'bg-indigo-100 text-indigo-700',
  trend: 'bg-rose-100 text-rose-700',
};

const BADGE_LABELS = {
  timeline: 'Timeline',
  bottleneck: 'Bottleneck',
  resource: 'Resources',
  positive: 'Good news',
  action: 'Action needed',
  trend: 'Trend',
};

const InsightCard = ({ insight }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = INSIGHT_ICONS[insight.type] || Zap;
  const colorClass = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.action;
  const badgeClass = BADGE_COLORS[insight.type] || BADGE_COLORS.action;
  const badgeLabel = BADGE_LABELS[insight.type] || insight.type;

  return (
    <div className={`rounded-lg border p-3 ${colorClass}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}>{badgeLabel}</span>
            <span className="text-sm font-semibold leading-tight">{insight.title}</span>
          </div>
          <p className="text-xs leading-relaxed opacity-80">{insight.summary}</p>
          {insight.detail && (
            <>
              {expanded && (
                <p className="text-xs leading-relaxed opacity-70 mt-1 border-t border-current/20 pt-1">{insight.detail}</p>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-[10px] font-medium mt-1 opacity-60 hover:opacity-100"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AIInsightsWidget = ({ project, milestones = [], tasks = [], logs = [] }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completionEstimate, setCompletionEstimate] = useState(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);

    const taskSummary = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
      urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
      assigned: tasks.filter(t => t.assigned_to).length,
      unassigned: tasks.filter(t => !t.assigned_to && t.status !== 'done').length,
    };

    const milestoneSummary = {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      overdue: milestones.filter(m => m.due_date && new Date(m.due_date) < new Date() && m.status !== 'completed').length,
      upcoming: milestones.filter(m => m.due_date && new Date(m.due_date) > new Date() && m.status !== 'completed').length,
    };

    const recentActivity = logs.slice(0, 20).map(l => ({
      action: l.action_type,
      description: l.action_description,
      user: l.user_name || l.user_email,
      date: l.created_date,
    }));

    // Activity frequency: group by day over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(l => new Date(l.created_date) > sevenDaysAgo);
    const activityByUser = {};
    recentLogs.forEach(l => {
      const key = l.user_email || 'unknown';
      activityByUser[key] = (activityByUser[key] || 0) + 1;
    });

    const prompt = `You are a project management AI analyst. Analyze the following project data and provide actionable insights.

PROJECT: "${project.title}"
Description: ${project.description || 'N/A'}
Status: ${project.status}
Collaborators: ${project.collaborator_emails?.length || 1}

TASK SUMMARY:
- Total tasks: ${taskSummary.total}
- To do: ${taskSummary.todo}, In progress: ${taskSummary.in_progress}, Done: ${taskSummary.done}
- Overdue: ${taskSummary.overdue}, Urgent & open: ${taskSummary.urgent}
- Unassigned open tasks: ${taskSummary.unassigned} (out of ${taskSummary.total - taskSummary.done} remaining)

MILESTONE SUMMARY:
- Total: ${milestoneSummary.total}, Completed: ${milestoneSummary.completed}
- Overdue milestones: ${milestoneSummary.overdue}, Upcoming: ${milestoneSummary.upcoming}

RECENT ACTIVITY (last 7 days):
- Total actions: ${recentLogs.length}
- Active users: ${Object.keys(activityByUser).length}
- Activity per user: ${JSON.stringify(activityByUser)}

RECENT EVENTS (last 20):
${recentActivity.map(a => `- [${a.date ? new Date(a.date).toLocaleDateString() : '?'}] ${a.user}: ${a.description}`).join('\n')}

Provide a JSON response with:
1. "completion_estimate": a string like "2-3 weeks", "~1 month", "on track for [milestone name]", or "unclear" if data is insufficient
2. "completion_confidence": "high", "medium", or "low"
3. "insights": an array of 3-5 insight objects, each with:
   - "type": one of "timeline", "bottleneck", "resource", "positive", "action", "trend"
   - "title": short title (max 8 words)
   - "summary": 1-2 sentence summary
   - "detail": optional deeper explanation or specific recommendation (1-2 sentences)

Focus on: timeline predictions, bottlenecks (stalled tasks, overdue items), resource gaps (unassigned tasks, inactive members), positive signals, and concrete actions.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            completion_estimate: { type: "string" },
            completion_confidence: { type: "string" },
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  summary: { type: "string" },
                  detail: { type: "string" },
                },
              },
            },
          },
        },
      });

      setInsights(result.insights || []);
      setCompletionEstimate({ estimate: result.completion_estimate, confidence: result.completion_confidence });
    } catch (err) {
      setError("Failed to generate insights. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [project, tasks, milestones, logs]);

  const confidenceColor = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-red-600 bg-red-50',
  };

  if (!insights && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">AI Project Analyst</p>
          <p className="text-xs text-gray-500 mt-0.5 max-w-xs">Analyze tasks, milestones, and activity to get smart insights about your project.</p>
        </div>
        <Button onClick={analyze} className="cu-button gap-2" size="sm">
          <Sparkles className="w-3.5 h-3.5" /> Analyze Project
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-purple-600">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <p className="text-sm font-medium">Analyzing your project data...</p>
        <p className="text-xs text-gray-400">This may take a few seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-3 text-red-500">
        <AlertTriangle className="w-6 h-6" />
        <p className="text-sm">{error}</p>
        <Button onClick={analyze} variant="outline" size="sm" className="gap-1">
          <RefreshCw className="w-3 h-3" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Completion estimate banner */}
      {completionEstimate && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Estimated Completion</p>
              <p className="text-sm font-bold text-gray-900">{completionEstimate.estimate}</p>
            </div>
          </div>
          {completionEstimate.confidence && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${confidenceColor[completionEstimate.confidence] || 'text-gray-600 bg-gray-100'}`}>
              {completionEstimate.confidence} confidence
            </span>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="space-y-2">
        {(insights || []).map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-end pt-1">
        <Button onClick={analyze} variant="ghost" size="sm" className="text-xs gap-1 text-gray-400 hover:text-purple-600">
          <RefreshCw className="w-3 h-3" /> Refresh Analysis
        </Button>
      </div>
    </div>
  );
};

export default AIInsightsWidget;