import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, GripVertical, X, Plus, LayoutGrid, RotateCcw } from 'lucide-react';
import {
  MilestoneWidget,
  TaskWidget,
  TeamWidget,
  ProgressWidget,
  ActivityWidget,
  QuickLinksWidget,
  MetricsWidget,
  QuickActionsWidget,
} from './DashboardWidgets';

const WIDGET_CATALOG = [
  { id: 'progress', title: 'Overall Progress', description: 'Completion bars for milestones & tasks', icon: '📊', size: 'full' },
  { id: 'milestones', title: 'Milestones', description: 'Milestone completion & upcoming items', icon: '🚩', size: 'half' },
  { id: 'tasks', title: 'Task Status', description: 'Task breakdown by status', icon: '✅', size: 'half' },
  { id: 'team', title: 'Team Members', description: 'Project collaborators at a glance', icon: '👥', size: 'half' },
  { id: 'activity', title: 'Recent Activity', description: 'Latest actions from your team', icon: '⚡', size: 'half' },
  { id: 'metrics', title: 'Key Metrics', description: 'Urgent tasks, overdue, weekly activity', icon: '📈', size: 'half' },
  { id: 'quicklinks', title: 'Quick Links', description: 'Project URLs for fast access', icon: '🔗', size: 'half' },
  { id: 'quickactions', title: 'Quick Actions', description: 'Navigate to workspace sections', icon: '⚡', size: 'half' },
];

const DEFAULT_LAYOUT = ['progress', 'milestones', 'tasks', 'activity', 'metrics'];

const STORAGE_KEY_PREFIX = 'cu_dashboard_layout_';

const getStoredLayout = (projectId) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + projectId);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

const saveLayout = (projectId, layout) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(layout));
  } catch {}
};

const WidgetRenderer = ({ widgetId, data, onTabChange }) => {
  switch (widgetId) {
    case 'progress': return <ProgressWidget {...data} />;
    case 'milestones': return <MilestoneWidget milestones={data.milestones} />;
    case 'tasks': return <TaskWidget tasks={data.tasks} />;
    case 'team': return <TeamWidget project={data.project} projectUsers={data.projectUsers} />;
    case 'activity': return <ActivityWidget logs={data.logs} />;
    case 'quicklinks': return <QuickLinksWidget project={data.project} />;
    case 'metrics': return <MetricsWidget {...data} />;
    case 'quickactions': return <QuickActionsWidget onTabChange={onTabChange} />;
    default: return null;
  }
};

const CustomizableDashboard = ({ project, currentUser, projectUsers = [], milestones = [], tasks = [], logs = [], onTabChange }) => {
  const projectId = project?.id;
  const [layout, setLayout] = useState(() => getStoredLayout(projectId) || DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  const widgetData = { project, projectUsers, milestones, tasks, logs };

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const newLayout = Array.from(layout);
    const [removed] = newLayout.splice(result.source.index, 1);
    newLayout.splice(result.destination.index, 0, removed);
    setLayout(newLayout);
    saveLayout(projectId, newLayout);
  }, [layout, projectId]);

  const removeWidget = (widgetId) => {
    const newLayout = layout.filter(id => id !== widgetId);
    setLayout(newLayout);
    saveLayout(projectId, newLayout);
  };

  const addWidget = (widgetId) => {
    if (layout.includes(widgetId)) return;
    const newLayout = [...layout, widgetId];
    setLayout(newLayout);
    saveLayout(projectId, newLayout);
    setShowCatalog(false);
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    saveLayout(projectId, DEFAULT_LAYOUT);
  };

  const getWidgetMeta = (id) => WIDGET_CATALOG.find(w => w.id === id) || { title: id, size: 'half' };

  // Group widgets into rows: full-width ones get their own row, halves are paired
  const buildRows = () => {
    const rows = [];
    let halfBuffer = [];
    layout.forEach(id => {
      const meta = getWidgetMeta(id);
      if (meta.size === 'full') {
        if (halfBuffer.length > 0) { rows.push(halfBuffer); halfBuffer = []; }
        rows.push([id]);
      } else {
        halfBuffer.push(id);
        if (halfBuffer.length === 2) { rows.push(halfBuffer); halfBuffer = []; }
      }
    });
    if (halfBuffer.length > 0) rows.push(halfBuffer);
    return rows;
  };

  const availableToAdd = WIDGET_CATALOG.filter(w => !layout.includes(w.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900">Project Dashboard</h2>
          <span className="text-xs text-gray-400 hidden sm:inline">Drag to rearrange</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={resetLayout} className="text-xs gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowCatalog(!showCatalog); }} className="text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Widget
              </Button>
            </>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsEditing(!isEditing); setShowCatalog(false); }}
            className="text-xs gap-1"
            style={isEditing ? { background: 'var(--cu-primary)' } : {}}
          >
            <Settings className="w-3 h-3" />
            {isEditing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Widget Catalog */}
      {showCatalog && (
        <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Available Widgets</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableToAdd.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-full text-center py-2">All widgets are already on your dashboard</p>
              ) : availableToAdd.map(w => (
                <button
                  key={w.id}
                  onClick={() => addWidget(w.id)}
                  className="flex flex-col items-start p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <span className="text-lg mb-1">{w.icon}</span>
                  <span className="text-xs font-semibold text-gray-800">{w.title}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">{w.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      {isEditing ? (
        // Editing mode: flat draggable list
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layout.map((widgetId, index) => {
                  const meta = getWidgetMeta(widgetId);
                  return (
                    <Draggable key={widgetId} draggableId={widgetId} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${meta.size === 'full' ? 'md:col-span-2' : ''} ${snapshot.isDragging ? 'opacity-80 shadow-xl' : ''}`}
                        >
                          <Card className="cu-card border-2 border-dashed border-gray-200">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-sm">{meta.icon}</span>
                                <CardTitle className="text-sm font-semibold text-gray-700">{meta.title}</CardTitle>
                              </div>
                              <button onClick={() => removeWidget(widgetId)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </CardHeader>
                            <CardContent className="pt-0 opacity-50 pointer-events-none select-none">
                              <WidgetRenderer widgetId={widgetId} data={widgetData} onTabChange={onTabChange} />
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // View mode: clean grid layout
        <div className="space-y-4">
          {buildRows().map((row, rowIdx) => (
            <div key={rowIdx} className={`grid gap-4 ${row.length === 1 && getWidgetMeta(row[0]).size === 'full' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {row.map(widgetId => {
                const meta = getWidgetMeta(widgetId);
                return (
                  <Card key={widgetId} className="cu-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span>{meta.icon}</span>
                        {meta.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <WidgetRenderer widgetId={widgetId} data={widgetData} onTabChange={onTabChange} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {layout.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No widgets on your dashboard.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setIsEditing(true); setShowCatalog(true); }}>
            <Plus className="w-3 h-3 mr-1" /> Add a widget
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomizableDashboard;