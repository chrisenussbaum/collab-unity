import React from 'react';
import { getUserColor } from './CodePlaygroundPresence';

export default function CollaborativeCursor({ 
  cursors, 
  currentUser, 
  containerRef,
  fileId 
}) {
  // Filter cursors for the current file and exclude current user
  const visibleCursors = cursors.filter(
    cursor => cursor.fileId === fileId && cursor.email !== currentUser?.email
  );

  if (!containerRef?.current || visibleCursors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {visibleCursors.map((cursor) => {
        const userColor = getUserColor(cursor.email);
        
        return (
          <div
            key={cursor.email}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              zIndex: 1000
            }}
          >
            {/* Cursor */}
            <svg
              width="12"
              height="18"
              viewBox="0 0 12 18"
              fill="none"
              className="drop-shadow-sm"
            >
              <path
                d="M0 0L12 12L6.5 12L3.5 18L0 12V0Z"
                fill={userColor.bg}
              />
            </svg>
            
            {/* Name Label */}
            <div
              className="absolute left-3 top-3 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: userColor.bg,
                color: userColor.text
              }}
            >
              {cursor.name || cursor.email?.split('@')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper component to show cursor position indicator in the line number area
export function CursorLineIndicator({ cursors, currentUser, fileId, totalLines }) {
  const visibleCursors = cursors.filter(
    cursor => cursor.fileId === fileId && cursor.email !== currentUser?.email
  );

  if (visibleCursors.length === 0) return null;

  return (
    <div className="absolute left-0 top-0 w-1 h-full pointer-events-none">
      {visibleCursors.map((cursor) => {
        if (!cursor.line || cursor.line < 1 || cursor.line > totalLines) return null;
        
        const userColor = getUserColor(cursor.email);
        const topPercent = ((cursor.line - 1) / totalLines) * 100;

        return (
          <div
            key={cursor.email}
            className="absolute left-0 w-1 h-4 rounded-r"
            style={{
              top: `${topPercent}%`,
              backgroundColor: userColor.bg
            }}
            title={`${cursor.name || cursor.email} - Line ${cursor.line}`}
          />
        );
      })}
    </div>
  );
}