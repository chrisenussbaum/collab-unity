import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Plus, 
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Upload,
  Columns,
  Rows
} from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 26;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;

const createEmptyGrid = (rows = DEFAULT_ROWS, cols = DEFAULT_COLS) => {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ value: '', formula: '', style: {} });
    }
    grid.push(row);
  }
  return grid;
};

const getCellReference = (row, col) => `${COLUMN_LETTERS[col] || ''}${row + 1}`;

const evaluateFormula = (formula, grid) => {
  if (!formula.startsWith('=')) return formula;
  
  try {
    let expr = formula.substring(1).toUpperCase();
    
    // Handle SUM function
    const sumMatch = expr.match(/SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/);
    if (sumMatch) {
      const startCol = COLUMN_LETTERS.indexOf(sumMatch[1]);
      const startRow = parseInt(sumMatch[2]) - 1;
      const endCol = COLUMN_LETTERS.indexOf(sumMatch[3]);
      const endRow = parseInt(sumMatch[4]) - 1;
      
      let sum = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const val = parseFloat(grid[r]?.[c]?.value) || 0;
          sum += val;
        }
      }
      return sum.toString();
    }
    
    // Handle AVERAGE function
    const avgMatch = expr.match(/AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/);
    if (avgMatch) {
      const startCol = COLUMN_LETTERS.indexOf(avgMatch[1]);
      const startRow = parseInt(avgMatch[2]) - 1;
      const endCol = COLUMN_LETTERS.indexOf(avgMatch[3]);
      const endRow = parseInt(avgMatch[4]) - 1;
      
      let sum = 0;
      let count = 0;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const val = parseFloat(grid[r]?.[c]?.value);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
      }
      return count > 0 ? (sum / count).toFixed(2) : '0';
    }
    
    // Handle cell references (e.g., A1 + B2)
    expr = expr.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
      const c = COLUMN_LETTERS.indexOf(col);
      const r = parseInt(row) - 1;
      const val = parseFloat(grid[r]?.[c]?.value) || 0;
      return val.toString();
    });
    
    // Evaluate simple math
    const result = Function('"use strict"; return (' + expr + ')')();
    return isNaN(result) ? '#ERROR' : result.toString();
  } catch (e) {
    return '#ERROR';
  }
};

export default function SpreadsheetEditor({ 
  codeProject, 
  project, 
  currentUser,
  onClose,
  onSave,
  isReadOnly = false
}) {
  const [title, setTitle] = useState(codeProject?.title || 'Untitled Spreadsheet');
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selection, setSelection] = useState(null);
  const [colWidths, setColWidths] = useState(Array(DEFAULT_COLS).fill(DEFAULT_COL_WIDTH));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(codeProject?.updated_date || null);

  const gridRef = useRef(null);
  const inputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    if (codeProject?.content) {
      try {
        const parsed = JSON.parse(codeProject.content);
        if (parsed.grid) {
          setGrid(parsed.grid);
        }
        if (parsed.colWidths) {
          setColWidths(parsed.colWidths);
        }
      } catch (error) {
        console.error("Error parsing saved spreadsheet:", error);
      }
    }
  }, [codeProject]);

  useEffect(() => {
    if (hasUnsavedChanges && !isReadOnly) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [hasUnsavedChanges, grid, title, isReadOnly]);

  const getCellDisplayValue = useCallback((row, col) => {
    const cell = grid[row]?.[col];
    if (!cell) return '';
    if (cell.formula) {
      return evaluateFormula(cell.formula, grid);
    }
    return cell.value;
  }, [grid]);

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (row, col) => {
    if (isReadOnly) return;
    setEditingCell({ row, col });
    const cell = grid[row]?.[col];
    setEditValue(cell?.formula || cell?.value || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCellChange = (value) => {
    setEditValue(value);
  };

  const commitCellEdit = () => {
    if (!editingCell) return;
    
    const { row, col } = editingCell;
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    
    if (editValue.startsWith('=')) {
      newGrid[row][col] = { ...newGrid[row][col], formula: editValue, value: '' };
    } else {
      newGrid[row][col] = { ...newGrid[row][col], value: editValue, formula: '' };
    }
    
    setGrid(newGrid);
    setEditingCell(null);
    setHasUnsavedChanges(true);
  };

  const handleKeyDown = (e) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        commitCellEdit();
        setSelectedCell({ row: Math.min(editingCell.row + 1, grid.length - 1), col: editingCell.col });
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitCellEdit();
        setSelectedCell({ row: editingCell.row, col: Math.min(editingCell.col + 1, grid[0].length - 1) });
      }
    } else {
      if (e.key === 'Enter' || e.key === 'F2') {
        handleCellDoubleClick(selectedCell.row, selectedCell.col);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCell({ row: Math.max(0, selectedCell.row - 1), col: selectedCell.col });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCell({ row: Math.min(grid.length - 1, selectedCell.row + 1), col: selectedCell.col });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCell({ row: selectedCell.row, col: Math.max(0, selectedCell.col - 1) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedCell({ row: selectedCell.row, col: Math.min(grid[0].length - 1, selectedCell.col + 1) });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isReadOnly) {
          const newGrid = [...grid];
          newGrid[selectedCell.row] = [...newGrid[selectedCell.row]];
          newGrid[selectedCell.row][selectedCell.col] = { value: '', formula: '', style: {} };
          setGrid(newGrid);
          setHasUnsavedChanges(true);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        handleCellDoubleClick(selectedCell.row, selectedCell.col);
        setEditValue(e.key);
      }
    }
  };

  const addRow = () => {
    if (isReadOnly) return;
    const newRow = Array(grid[0].length).fill(null).map(() => ({ value: '', formula: '', style: {} }));
    setGrid([...grid, newRow]);
    setHasUnsavedChanges(true);
  };

  const addColumn = () => {
    if (isReadOnly) return;
    const newGrid = grid.map(row => [...row, { value: '', formula: '', style: {} }]);
    setGrid(newGrid);
    setColWidths([...colWidths, DEFAULT_COL_WIDTH]);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) return;
    if (!title.trim()) {
      toast.error("Please enter a spreadsheet title");
      return;
    }

    setIsSaving(true);
    try {
      const content = JSON.stringify({ grid, colWidths });
      const data = {
        project_id: project.id,
        ide_type: 'spreadsheet',
        title: title.trim(),
        content,
        last_modified_by: currentUser.email,
        is_active: true
      };

      if (codeProject?.id) {
        await base44.entities.ProjectIDE.update(codeProject.id, data);
      } else {
        const newSpreadsheet = await base44.entities.ProjectIDE.create(data);
        if (onSave) onSave(newSpreadsheet);
      }

      setHasUnsavedChanges(false);
      setLastSaved(new Date().toISOString());
      if (!isAutoSave) toast.success("Saved");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly || !codeProject?.id) return;
    setIsDeleting(true);
    try {
      await base44.entities.ProjectIDE.delete(codeProject.id);
      toast.success("Deleted");
      if (onClose) onClose(true);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleClose = () => {
    if (isReadOnly) {
      if (onClose) onClose(true);
      return;
    }
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm("Unsaved changes. Save before closing?");
      if (confirmClose) {
        handleSave().then(() => { if (onClose) onClose(true); });
        return;
      }
    }
    if (onClose) onClose(true);
  };

  const exportToCSV = () => {
    let csv = '';
    grid.forEach(row => {
      const rowValues = row.map((cell, colIdx) => {
        const displayValue = cell.formula ? evaluateFormula(cell.formula, grid) : cell.value;
        // Escape quotes and wrap in quotes if contains comma
        const escaped = displayValue.toString().replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      });
      csv += rowValues.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const diffMins = Math.floor((Date.now() - new Date(lastSaved)) / 60000);
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    return `Saved ${Math.floor(diffMins / 60)}h ago`;
  };

  const currentCell = grid[selectedCell.row]?.[selectedCell.col];

  return (
    <>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Spreadsheet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Delete "{title}"? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0}>
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 flex-1">
            {!isReadOnly && (
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Table className="w-6 h-6 text-teal-600" />
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasUnsavedChanges(true); }}
              placeholder="Spreadsheet Title"
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 max-w-md"
              readOnly={isReadOnly}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {!isReadOnly && lastSaved && <span className="text-xs text-gray-500 hidden md:inline">{getLastSavedText()}</span>}
            {!isReadOnly && hasUnsavedChanges && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
            {isReadOnly && <Badge className="bg-blue-100 text-blue-700">Read Only</Badge>}
            
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            {!isReadOnly && codeProject?.id && (
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {!isReadOnly && (
              <Button onClick={() => handleSave(false)} disabled={isSaving || !hasUnsavedChanges} size="sm">
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Formula Bar */}
        <div className="bg-white border-b px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Badge variant="outline" className="font-mono text-sm min-w-[60px] justify-center">
            {getCellReference(selectedCell.row, selectedCell.col)}
          </Badge>
          <Input
            value={editingCell ? editValue : (currentCell?.formula || currentCell?.value || '')}
            onChange={(e) => editingCell && handleCellChange(e.target.value)}
            onFocus={() => !editingCell && handleCellDoubleClick(selectedCell.row, selectedCell.col)}
            className="flex-1 font-mono text-sm"
            placeholder="Enter value or formula (e.g., =SUM(A1:A10))"
            readOnly={isReadOnly}
          />
          
          {!isReadOnly && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={addColumn} title="Add Column">
                <Columns className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={addRow} title="Add Row">
                <Rows className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto" ref={gridRef}>
          <table className="border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-gray-100 border border-gray-300 w-12 h-7 text-xs font-medium text-gray-600 sticky left-0 z-20" />
                {colWidths.map((width, col) => (
                  <th 
                    key={col}
                    className="bg-gray-100 border border-gray-300 h-7 text-xs font-medium text-gray-600"
                    style={{ width, minWidth: width }}
                  >
                    {COLUMN_LETTERS[col]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="bg-gray-100 border border-gray-300 text-center text-xs font-medium text-gray-600 sticky left-0 z-10" style={{ height: DEFAULT_ROW_HEIGHT }}>
                    {rowIdx + 1}
                  </td>
                  {row.map((cell, colIdx) => {
                    const isSelected = selectedCell.row === rowIdx && selectedCell.col === colIdx;
                    const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                    const displayValue = getCellDisplayValue(rowIdx, colIdx);
                    
                    return (
                      <td
                        key={colIdx}
                        className={`border border-gray-200 px-1 text-sm ${
                          isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : 'bg-white hover:bg-gray-50'
                        }`}
                        style={{ 
                          width: colWidths[colIdx], 
                          minWidth: colWidths[colIdx],
                          height: DEFAULT_ROW_HEIGHT,
                          ...cell.style
                        }}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        onDoubleClick={() => handleCellDoubleClick(rowIdx, colIdx)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => handleCellChange(e.target.value)}
                            onBlur={commitCellEdit}
                            className="w-full h-full border-none outline-none bg-transparent text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="block truncate">{displayValue}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-t px-4 py-1 text-xs text-gray-600 flex items-center justify-between flex-shrink-0">
          <span>{grid.length} rows × {grid[0]?.length || 0} columns</span>
          <span>Supports: =SUM(), =AVERAGE(), cell references (A1+B2)</span>
        </div>
      </div>
    </>
  );
}