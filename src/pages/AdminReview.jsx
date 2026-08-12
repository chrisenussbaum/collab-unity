import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Bug as BugIcon, Trash2, ExternalLink, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  investigating: { label: "Investigating", color: "bg-blue-100 text-blue-800" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800" },
  wont_fix: { label: "Won't Fix", color: "bg-gray-100 text-gray-600" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
};

export default function AdminReview({ currentUser }) {
  const [bugs, setBugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingBug, setEditingBug] = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (currentUser && !isAdmin) {
      toast.error("Admin access only.");
      window.location.href = "/";
      return;
    }
    if (isAdmin) fetchBugs();
  }, []);

  const fetchBugs = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Bug.list('-created_date', 100);
      setBugs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching bugs:", error);
      toast.error("Failed to load bug reports.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (bug, updates) => {
    try {
      await base44.entities.Bug.update(bug.id, updates);
      setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, ...updates } : b));
      toast.success("Bug updated.");
    } catch (error) {
      console.error("Error updating bug:", error);
      toast.error("Failed to update bug.");
    }
  };

  const handleDelete = async (bug) => {
    if (!confirm(`Delete bug "${bug.title}"?`)) return;
    try {
      await base44.entities.Bug.delete(bug.id);
      setBugs(prev => prev.filter(b => b.id !== bug.id));
      setEditingBug(null);
      toast.success("Bug deleted.");
    } catch (error) {
      toast.error("Failed to delete bug.");
    }
  };

  if (!currentUser || !isAdmin) {
    return null;
  }

  const filtered = bugs.filter(b => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q) || b.reporter_email?.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Review</h1>
            <p className="text-gray-500 text-sm">Review and manage reported bugs</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title, description, or reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="wont_fix">Won't Fix</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="cu-card">
            <CardContent className="py-16 text-center text-gray-500">
              <BugIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No bug reports to review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(bug => {
              const statusCfg = STATUS_CONFIG[bug.status] || STATUS_CONFIG.pending;
              const priorityCfg = PRIORITY_CONFIG[bug.priority] || PRIORITY_CONFIG.medium;
              return (
                <Card key={bug.id} className="cu-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                          <Badge className={priorityCfg.color}>{priorityCfg.label}</Badge>
                          <span className="text-xs text-gray-400">{bug.created_date ? format(new Date(bug.created_date), 'MMM d, yyyy') : ''}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate">{bug.title}</h3>
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => setEditingBug(bug)}>Review</Button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{bug.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="truncate">Reported by: {bug.reporter_name || bug.reporter_email || 'Anonymous'}</span>
                      {bug.page_url && (
                        <a href={bug.page_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-600 hover:underline flex-shrink-0">
                          Page <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!editingBug} onOpenChange={(open) => !open && setEditingBug(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {editingBug && (
              <>
                <DialogHeader>
                  <DialogTitle>Review Bug</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{editingBug.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{editingBug.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <Select value={editingBug.status} onValueChange={(v) => setEditingBug({ ...editingBug, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <Select value={editingBug.priority} onValueChange={(v) => setEditingBug({ ...editingBug, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRIORITY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Admin Notes</label>
                    <Textarea
                      value={editingBug.admin_notes || ''}
                      onChange={(e) => setEditingBug({ ...editingBug, admin_notes: e.target.value })}
                      placeholder="Internal notes about this bug..."
                      rows={4}
                    />
                  </div>
                  {editingBug.browser_info && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 break-words">
                      <strong>Browser:</strong> {editingBug.browser_info}
                    </div>
                  )}
                </div>
                <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
                  <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(editingBug)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingBug(null)}>Cancel</Button>
                    <Button className="cu-button" onClick={() => { handleUpdate(editingBug, { status: editingBug.status, priority: editingBug.priority, admin_notes: editingBug.admin_notes || '' }); setEditingBug(null); }}>Save Changes</Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}