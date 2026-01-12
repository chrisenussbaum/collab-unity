import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Point values for different actions
const POINTS = {
  PROFILE_COMPLETE: 100,
  PROJECT_CREATED: 50,
  PROJECT_COLLABORATION: 30,
  ENDORSEMENT_RECEIVED: 10,
  ENDORSEMENT_GIVEN: 5,
  REVIEW_RECEIVED: 20,
  REVIEW_GIVEN: 15,
  USER_INVITED: 25,
  DAILY_ACTIVITY: 5
};

// Levels based on points (every 500 points = 1 level)
const POINTS_PER_LEVEL = 500;

// Badge unlock conditions
const BADGE_CONDITIONS = {
  profile_complete: (stats) => stats.total_points >= POINTS.PROFILE_COMPLETE,
  first_project: (stats) => stats.projects_created >= 1,
  five_projects: (stats) => stats.projects_created >= 5,
  first_collaboration: (stats) => stats.projects_collaborated >= 1,
  five_collaborations: (stats) => stats.projects_collaborated >= 5,
  ten_endorsements: (stats) => stats.endorsements_received >= 10,
  five_reviews: (stats) => stats.reviews_received >= 5,
  helpful_reviewer: (stats) => stats.reviews_given >= 5,
  community_supporter: (stats) => stats.endorsements_given >= 10,
  inviter: (stats) => stats.users_invited >= 3,
  streak_7: (stats) => stats.activity_streak >= 7,
  streak_30: (stats) => stats.activity_streak >= 30,
  level_5: (stats) => stats.level >= 5,
  level_10: (stats) => stats.level >= 10,
  level_20: (stats) => stats.level >= 20
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, user_email, metadata = {} } = await req.json();

    if (!action || !user_email) {
      return Response.json({ error: 'Missing required fields: action, user_email' }, { status: 400 });
    }

    // Get or create user game stats
    let userStats = await base44.asServiceRole.entities.UserGameStats.filter({ user_email });
    
    if (!userStats || userStats.length === 0) {
      // Create new stats
      userStats = await base44.asServiceRole.entities.UserGameStats.create({
        user_email,
        total_points: 0,
        level: 1,
        badges: [],
        achievements: {},
        activity_streak: 0,
        projects_created: 0,
        projects_collaborated: 0,
        endorsements_given: 0,
        endorsements_received: 0,
        reviews_given: 0,
        reviews_received: 0,
        users_invited: 0
      });
    } else {
      userStats = userStats[0];
    }

    // Calculate points and update stats based on action
    let pointsToAward = 0;
    let updates = {};

    switch (action) {
      case 'profile_complete':
        pointsToAward = POINTS.PROFILE_COMPLETE;
        break;
      case 'project_created':
        pointsToAward = POINTS.PROJECT_CREATED;
        updates.projects_created = (userStats.projects_created || 0) + 1;
        break;
      case 'project_collaboration':
        pointsToAward = POINTS.PROJECT_COLLABORATION;
        updates.projects_collaborated = (userStats.projects_collaborated || 0) + 1;
        break;
      case 'endorsement_received':
        pointsToAward = POINTS.ENDORSEMENT_RECEIVED;
        updates.endorsements_received = (userStats.endorsements_received || 0) + 1;
        break;
      case 'endorsement_given':
        pointsToAward = POINTS.ENDORSEMENT_GIVEN;
        updates.endorsements_given = (userStats.endorsements_given || 0) + 1;
        break;
      case 'review_received':
        pointsToAward = POINTS.REVIEW_RECEIVED;
        updates.reviews_received = (userStats.reviews_received || 0) + 1;
        break;
      case 'review_given':
        pointsToAward = POINTS.REVIEW_GIVEN;
        updates.reviews_given = (userStats.reviews_given || 0) + 1;
        break;
      case 'user_invited':
        pointsToAward = POINTS.USER_INVITED;
        updates.users_invited = (userStats.users_invited || 0) + 1;
        break;
      case 'daily_activity':
        pointsToAward = POINTS.DAILY_ACTIVITY;
        // Update activity streak
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = userStats.last_activity_date;
        
        if (lastActivity) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (lastActivity === yesterday) {
            updates.activity_streak = (userStats.activity_streak || 0) + 1;
          } else if (lastActivity !== today) {
            updates.activity_streak = 1;
          }
        } else {
          updates.activity_streak = 1;
        }
        updates.last_activity_date = today;
        break;
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update total points and calculate new level
    const newTotalPoints = (userStats.total_points || 0) + pointsToAward;
    const newLevel = Math.floor(newTotalPoints / POINTS_PER_LEVEL) + 1;
    const leveledUp = newLevel > (userStats.level || 1);

    updates.total_points = newTotalPoints;
    updates.level = newLevel;

    // Check for newly unlocked badges
    const currentBadges = userStats.badges || [];
    const newBadges = [...currentBadges];
    const unlockedBadges = [];

    // Create a temporary stats object with updates to check badge conditions
    const tempStats = { ...userStats, ...updates };

    for (const [badgeId, condition] of Object.entries(BADGE_CONDITIONS)) {
      if (!currentBadges.includes(badgeId) && condition(tempStats)) {
        newBadges.push(badgeId);
        unlockedBadges.push(badgeId);
      }
    }

    if (newBadges.length > currentBadges.length) {
      updates.badges = newBadges;
    }

    // Update the stats
    const updatedStats = await base44.asServiceRole.entities.UserGameStats.update(userStats.id, updates);

    return Response.json({
      success: true,
      pointsAwarded: pointsToAward,
      newTotalPoints: newTotalPoints,
      level: newLevel,
      leveledUp,
      unlockedBadges,
      stats: updatedStats
    });

  } catch (error) {
    console.error('Error awarding points:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});