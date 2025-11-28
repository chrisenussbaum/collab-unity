import React from 'react';

/**
 * Checks if a project has active collaborators based on their last_activity_at
 * A user is considered active if they were active within the last 5 minutes
 */
export const isProjectActive = (collaboratorEmails, userProfiles) => {
  if (!collaboratorEmails || !userProfiles || collaboratorEmails.length === 0) {
    return false;
  }

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  return collaboratorEmails.some(email => {
    const profile = userProfiles[email];
    if (!profile?.last_activity_at) return false;
    return new Date(profile.last_activity_at).getTime() > fiveMinutesAgo;
  });
};

/**
 * Green dot indicator component for active projects
 */
const ProjectActivityIndicator = ({ isActive, size = 'sm', className = '' }) => {
  if (!isActive) return null;

  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3'
  };

  return (
    <div 
      className={`${sizeClasses[size] || sizeClasses.sm} bg-green-500 rounded-full flex-shrink-0 ${className}`}
      title="Collaborators are active on this project"
    />
  );
};

export default ProjectActivityIndicator;