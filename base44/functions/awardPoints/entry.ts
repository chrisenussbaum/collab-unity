import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { levelForPoints, applyAction, computeNewBadges } from '../../shared/scoring.ts';

// Point values, level math, and badge rules live in ../../shared/scoring.ts

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

    // Calculate points and updates based on the action
    const applied = applyAction(userStats, action);
    if (!applied) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    const { pointsToAward, updates } = applied;

    // Update total points and calculate new level
    const newTotalPoints = (userStats.total_points || 0) + pointsToAward;
    const newLevel = levelForPoints(newTotalPoints);
    const leveledUp = newLevel > (userStats.level || 1);

    updates.total_points = newTotalPoints;
    updates.level = newLevel;

    // Check for newly unlocked badges
    const tempStats = { ...userStats, ...updates };
    const { badges, unlockedBadges } = computeNewBadges(userStats.badges || [], tempStats);
    if (unlockedBadges.length > 0) {
      updates.badges = badges;
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