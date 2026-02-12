import React from 'react';

export default function PresenceIndicator({ lastActive, size = 'default', showLabel = false }) {
  const getPresenceStatus = () => {
    if (!lastActive) return 'offline';
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const minutesAgo = (now - lastActiveDate) / (1000 * 60);
    
    if (minutesAgo < 5) return 'online';
    if (minutesAgo < 30) return 'away';
    return 'offline';
  };

  const status = getPresenceStatus();

  const sizeClasses = {
    small: 'w-2 h-2',
    default: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  const statusLabels = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${sizeClasses[size]} ${statusColors[status]} rounded-full ring-2 ring-white`} />
      {showLabel && (
        <span className="text-xs text-gray-600">{statusLabels[status]}</span>
      )}
    </div>
  );
}