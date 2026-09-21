// Shared scoring logic for Collab Unity's gamification system.
// Used by the awardPoints backend function and the scheduled staleProjectSweep
// so point values, level math, slot capacity, and badge rules live in one place.

export const POINTS = {
  PROJECT_CREATED: 25,
  PROFILE_COMPLETE: 75,
  PROJECT_COLLABORATION: 50,
  USER_INVITED: 40,
  REVIEW_RECEIVED: 20,
  REVIEW_GIVEN: 15,
  ENDORSEMENT_RECEIVED: 10,
  ENDORSEMENT_GIVEN: 5,
  DAILY_ACTIVITY: 5,
  TASK_COMPLETED: 10,
  MILESTONE_COMPLETED: 30,
  WEEKLY_PROJECT_ACTIVITY: 15,
  PROJECT_COMPLETED: 200
};

export const POINTS_PER_LEVEL = 500;

export function levelForPoints(totalPoints) {
  return Math.floor((totalPoints || 0) / POINTS_PER_LEVEL) + 1;
}

// Active project slot capacity by level: new users get 2, growing to a max of 5.
export function slotCapacityForLevel(level) {
  const lvl = level || 1;
  if (lvl <= 2) return 2;
  if (lvl <= 4) return 3;
  if (lvl <= 7) return 4;
  return 5;
}

// Returns { pointsToAward, updates } for a supported action, or null for unknown actions.
export function applyAction(stats, action) {
  const updates = {};
  let pointsToAward = 0;

  switch (action) {
    case 'profile_complete':
      pointsToAward = POINTS.PROFILE_COMPLETE;
      break;
    case 'project_created':
      pointsToAward = POINTS.PROJECT_CREATED;
      updates.projects_created = (stats.projects_created || 0) + 1;
      break;
    case 'project_collaboration':
      pointsToAward = POINTS.PROJECT_COLLABORATION;
      updates.projects_collaborated = (stats.projects_collaborated || 0) + 1;
      break;
    case 'endorsement_received':
      pointsToAward = POINTS.ENDORSEMENT_RECEIVED;
      updates.endorsements_received = (stats.endorsements_received || 0) + 1;
      break;
    case 'endorsement_given':
      pointsToAward = POINTS.ENDORSEMENT_GIVEN;
      updates.endorsements_given = (stats.endorsements_given || 0) + 1;
      break;
    case 'review_received':
      pointsToAward = POINTS.REVIEW_RECEIVED;
      updates.reviews_received = (stats.reviews_received || 0) + 1;
      break;
    case 'review_given':
      pointsToAward = POINTS.REVIEW_GIVEN;
      updates.reviews_given = (stats.reviews_given || 0) + 1;
      break;
    case 'user_invited':
      pointsToAward = POINTS.USER_INVITED;
      updates.users_invited = (stats.users_invited || 0) + 1;
      break;
    case 'daily_activity': {
      pointsToAward = POINTS.DAILY_ACTIVITY;
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = stats.last_activity_date;
      if (lastActivity) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (lastActivity === yesterday) {
          updates.activity_streak = (stats.activity_streak || 0) + 1;
        } else if (lastActivity !== today) {
          updates.activity_streak = 1;
        }
      } else {
        updates.activity_streak = 1;
      }
      updates.last_activity_date = today;
      break;
    }
    case 'task_completed':
      pointsToAward = POINTS.TASK_COMPLETED;
      updates.tasks_completed = (stats.tasks_completed || 0) + 1;
      break;
    case 'milestone_completed':
      pointsToAward = POINTS.MILESTONE_COMPLETED;
      updates.milestones_completed = (stats.milestones_completed || 0) + 1;
      break;
    case 'weekly_project_activity':
      pointsToAward = POINTS.WEEKLY_PROJECT_ACTIVITY;
      break;
    case 'project_completed':
      pointsToAward = POINTS.PROJECT_COMPLETED;
      updates.projects_completed = (stats.projects_completed || 0) + 1;
      break;
    default:
      return null;
  }

  return { pointsToAward, updates };
}

export const BADGE_CONDITIONS = {
  profile_complete: (stats) => (stats.total_points || 0) >= POINTS.PROFILE_COMPLETE,
  first_project: (stats) => (stats.projects_created || 0) >= 1,
  first_completion: (stats) => (stats.projects_completed || 0) >= 1,
  five_completions: (stats) => (stats.projects_completed || 0) >= 5,
  first_collaboration: (stats) => (stats.projects_collaborated || 0) >= 1,
  five_collaborations: (stats) => (stats.projects_collaborated || 0) >= 5,
  ten_endorsements: (stats) => (stats.endorsements_received || 0) >= 10,
  five_reviews: (stats) => (stats.reviews_received || 0) >= 5,
  helpful_reviewer: (stats) => (stats.reviews_given || 0) >= 5,
  community_supporter: (stats) => (stats.endorsements_given || 0) >= 10,
  inviter: (stats) => (stats.users_invited || 0) >= 3,
  streak_7: (stats) => (stats.activity_streak || 0) >= 7,
  streak_30: (stats) => (stats.activity_streak || 0) >= 30,
  level_5: (stats) => (stats.level || 1) >= 5,
  level_10: (stats) => (stats.level || 1) >= 10,
  level_20: (stats) => (stats.level || 1) >= 20
};

export function computeNewBadges(currentBadges, stats) {
  const badges = [...(currentBadges || [])];
  const unlockedBadges = [];
  for (const [badgeId, condition] of Object.entries(BADGE_CONDITIONS)) {
    if (!badges.includes(badgeId) && condition(stats)) {
      badges.push(badgeId);
      unlockedBadges.push(badgeId);
    }
  }
  return { badges, unlockedBadges };
}