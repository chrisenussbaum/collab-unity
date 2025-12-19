import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Trash2,
  Undo,
  Redo,
  Minus,
  Hand,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { ActivityLog } from '@/entities/all';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const COLORS = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function WhiteboardTool({ instance, project, currentUser, isCollaborator, onBack, onSave, onDelete }) {
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [paths, setPaths] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (instance?.content) {
      try {
        const data = JSON.parse(instance.content);
        setPaths(data.paths || []);
      } catch (e) {
        setPaths([]);
      }
    }
  }, [instance?.id]);

  const handleRefresh = async () => {
    if (hasUnsavedChanges && !window.confirm("Discard unsaved changes?")) return;
    setIsRefreshing(true);
    try {
      const results = await base44.entities.ProjectIDE.filter({ id: instance.id });
      const fresh = results?.[0];
      if (fresh?.content) {
        const data = JSON.parse(fresh.content);
        setPaths(data.paths || []);
        setUndoStack([]);
        setRedoStack([]);
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
      const content = JSON.stringify({ paths });
      await base44.entities.ProjectIDE.update(instance.id, {
        content,
        last_modified_by: currentUser.email
      });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'ideation_updated',
        action_description: `updated whiteboard "${instance.title}"`,
        entity_type: 'ideation',
        entity_id: instance.id
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

  const handleDeleteBoard = () => {
    if (onDelete) {
      onDelete(instance.id, 'whiteboard');
    }
  };

  const getPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Transform screen coordinates to canvas coordinates accounting for pan and zoom
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Handle pan mode
    if (tool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
      return;
    }
    
    if (!isCollaborator) return;
    setIsDrawing(true);
    const point = getPoint(e);
    
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentPath({
        type: 'path',
        points: [point],
        color: tool === 'eraser' ? '#FFFFFF' : color,
        strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth
      });
    } else if (tool === 'line') {
      setCurrentPath({
        type: 'line',
        start: point,
        end: point,
        color,
        strokeWidth
      });
    } else if (tool === 'rect') {
      setCurrentPath({
        type: 'rect',
        start: point,
        end: point,
        color,
        strokeWidth
      });
    } else if (tool === 'circle') {
      setCurrentPath({
        type: 'circle',
        center: point,
        radius: 0,
        color,
        strokeWidth
      });
    }
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Handle panning
    if (isPanning) {
      setPan({
        x: clientX - panStart.x,
        y: clientY - panStart.y
      });
      return;
    }
    
    if (!isDrawing || !currentPath) return;
    const point = getPoint(e);

    if (currentPath.type === 'path') {
      setCurrentPath(prev => ({
        ...prev,
        points: [...prev.points, point]
      }));
    } else if (currentPath.type === 'line') {
      setCurrentPath(prev => ({ ...prev, end: point }));
    } else if (currentPath.type === 'rect') {
      setCurrentPath(prev => ({ ...prev, end: point }));
    } else if (currentPath.type === 'circle') {
      const dx = point.x - currentPath.center.x;
      const dy = point.y - currentPath.center.y;
      setCurrentPath(prev => ({ ...prev, radius: Math.sqrt(dx * dx + dy * dy) }));
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (!isDrawing || !currentPath) return;
    setIsDrawing(false);
    
    setUndoStack(prev => [...prev, paths]);
    setRedoStack([]);
    setPaths(prev => [...prev, currentPath]);
    setCurrentPath(null);
    setHasUnsavedChanges(true);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, paths]);
    setPaths(prev);
    setUndoStack(u => u.slice(0, -1));
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, paths]);
    setPaths(next);
    setRedoStack(r => r.slice(0, -1));
    setHasUnsavedChanges(true);
  };

  const handleClear = () => {
    if (paths.length === 0) return;
    if (!window.confirm("Clear the entire whiteboard?")) return;
    setUndoStack(prev => [...prev, paths]);
    setRedoStack([]);
    setPaths([]);
    setHasUnsavedChanges(true);
  };

  const renderPath = (path, key) => {
    if (path.type === 'path' && path.points.length > 0) {
      const d = path.points.reduce((acc, p, i) => 
        i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
      );
      return (
        <path
          key={key}
          d={d}
          stroke={path.color}
          strokeWidth={path.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    } else if (path.type === 'line') {
      return (
        <line
          key={key}
          x1={path.start.x}
          y1={path.start.y}
          x2={path.end.x}
          y2={path.end.y}
          stroke={path.color}
          strokeWidth={path.strokeWidth}
          strokeLinecap="round"
        />
      );
    } else if (path.type === 'rect') {
      const x = Math.min(path.start.x, path.end.x);
      const y = Math.min(path.start.y, path.end.y);
      const width = Math.abs(path.end.x - path.start.x);
      const height = Math.abs(path.end.y - path.start.y);
      return (
        <rect
          key={key}
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={path.color}
          strokeWidth={path.strokeWidth}
          fill="none"
        />
      );
    } else if (path.type === 'circle') {
      return (
        <circle
          key={key}
          cx={path.center.x}
          cy={path.center.y}
          r={path.radius}
          stroke={path.color}
          strokeWidth={path.strokeWidth}
          fill="none"
        />
      );
    }
    return null;
  };

  const tools = [
    { id: 'hand', icon: Hand, label: 'Pan' },
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
  ];

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
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteBoard}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="cu-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{instance?.title || 'Whiteboard'}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          {isCollaborator && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1">
                {tools.map(t => (
                  <Button
                    key={t.id}
                    variant={tool === t.id ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setTool(t.id)}
                    title={t.label}
                  >
                    <t.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>

              <div className="h-6 w-px bg-gray-300" />

              <div className="flex items-center gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              <div className="h-6 w-px bg-gray-300" />

              <div className="flex items-center gap-2 w-32">
                <span className="text-xs text-gray-500">Size</span>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([v]) => setStrokeWidth(v)}
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                />
              </div>

              <div className="h-6 w-px bg-gray-300" />

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleUndo} disabled={undoStack.length === 0}>
                  <Undo className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRedo} disabled={redoStack.length === 0}>
                  <Redo className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600" onClick={handleClear}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-gray-300" />

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="relative w-full h-[500px] bg-white rounded-lg border-2 overflow-hidden"
            style={{ touchAction: 'none' }}
            onWheel={handleWheel}
          >
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              style={{ 
                cursor: tool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : (isCollaborator ? 'crosshair' : 'default')
              }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {paths.map((path, i) => renderPath(path, i))}
                {currentPath && renderPath(currentPath, 'current')}
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}