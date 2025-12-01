import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Circle,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const NODE_COLORS = [
  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Amber
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }, // Blue
  { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // Green
  { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' }, // Pink
  { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' }, // Indigo
  { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }, // Red
];

export default function MindMapTool({ instance, project, currentUser, isCollaborator, onBack, onSave }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (instance?.content) {
      try {
        const data = JSON.parse(instance.content);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (e) {
        initializeDefault();
      }
    } else {
      initializeDefault();
    }
  }, [instance?.id]);

  const initializeDefault = () => {
    const centerNode = {
      id: `node-${Date.now()}`,
      x: 400,
      y: 300,
      text: 'Central Idea',
      color: NODE_COLORS[0]
    };
    setNodes([centerNode]);
    setEdges([]);
  };

  const handleRefresh = async () => {
    if (hasUnsavedChanges && !window.confirm("Discard unsaved changes?")) return;
    setIsRefreshing(true);
    try {
      const results = await base44.entities.ProjectIDE.filter({ id: instance.id });
      const fresh = results?.[0];
      if (fresh?.content) {
        const data = JSON.parse(fresh.content);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setHasUnsavedChanges(false);
        toast.success("Refreshed!");
      }
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = JSON.stringify({ nodes, edges });
      await base44.entities.ProjectIDE.update(instance.id, {
        content,
        last_modified_by: currentUser.email
      });
      setHasUnsavedChanges(false);
      toast.success("Saved!");
      if (onSave) onSave({ ...instance, content });
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const addNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      x: 200 + Math.random() * 400,
      y: 150 + Math.random() * 300,
      text: 'New Idea',
      color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]
    };
    setNodes(prev => [...prev, newNode]);
    setHasUnsavedChanges(true);
    setEditingNode(newNode.id);
    setEditText('New Idea');
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    setSelectedNode(null);
    setHasUnsavedChanges(true);
  };

  const handleNodeDrag = useCallback((nodeId, e) => {
    if (!isCollaborator) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, x, y } : n
    ));
    setHasUnsavedChanges(true);
  }, [zoom, pan, isCollaborator]);

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom !== node.id) {
        const edgeExists = edges.some(
          edge => (edge.from === connectingFrom && edge.to === node.id) ||
                  (edge.from === node.id && edge.to === connectingFrom)
        );
        if (!edgeExists) {
          setEdges(prev => [...prev, { from: connectingFrom, to: node.id }]);
          setHasUnsavedChanges(true);
        }
      }
      setConnectingFrom(null);
    } else {
      setSelectedNode(node.id);
    }
  };

  const handleNodeDoubleClick = (node, e) => {
    e.stopPropagation();
    if (!isCollaborator) return;
    setEditingNode(node.id);
    setEditText(node.text);
  };

  const handleEditSubmit = () => {
    if (editingNode && editText.trim()) {
      setNodes(prev => prev.map(n => 
        n.id === editingNode ? { ...n, text: editText.trim() } : n
      ));
      setHasUnsavedChanges(true);
    }
    setEditingNode(null);
    setEditText('');
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setConnectingFrom(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && <Badge variant="outline" className="text-amber-600">Unsaved</Badge>}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {isCollaborator && (
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      <Card className="cu-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{instance?.title || 'Mind Map'}</CardTitle>
            <div className="flex items-center gap-2">
              {isCollaborator && (
                <>
                  <Button variant="outline" size="sm" onClick={addNode}>
                    <Plus className="w-4 h-4 mr-1" /> Add Node
                  </Button>
                  <Button 
                    variant={connectingFrom ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setConnectingFrom(selectedNode || null)}
                    disabled={!selectedNode}
                  >
                    Connect
                  </Button>
                  {selectedNode && (
                    <Button variant="outline" size="sm" onClick={() => deleteNode(selectedNode)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
              <div className="flex items-center gap-1 ml-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={canvasRef}
            className="relative w-full h-[500px] bg-gray-50 rounded-lg border-2 border-dashed overflow-hidden cursor-grab"
            onClick={handleCanvasClick}
            onWheel={handleWheel}
          >
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
            >
              {edges.map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                return (
                  <line
                    key={i}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            <div 
              className="absolute inset-0"
              style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'top left' }}
            >
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`absolute cursor-pointer select-none transition-shadow ${
                    selectedNode === node.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                  } ${connectingFrom === node.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: node.x - 60,
                    top: node.y - 25,
                    width: 120,
                    backgroundColor: node.color.bg,
                    border: `2px solid ${node.color.border}`,
                    borderRadius: 12,
                    padding: '8px 12px'
                  }}
                  onClick={(e) => handleNodeClick(node, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                  draggable={isCollaborator}
                  onDragStart={(e) => {
                    dragRef.current = node.id;
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDrag={(e) => {
                    if (e.clientX && e.clientY) handleNodeDrag(node.id, e);
                  }}
                  onDragEnd={() => { dragRef.current = null; }}
                >
                  {editingNode === node.id ? (
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={handleEditSubmit}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                      className="h-6 text-xs p-1"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="text-xs font-medium text-center truncate"
                      style={{ color: node.color.text }}
                    >
                      {node.text}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {connectingFrom && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
                Click another node to connect
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}