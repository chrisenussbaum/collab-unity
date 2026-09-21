import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { slotCapacityForLevel } from '../../shared/scoring.ts';

/**
 * Returns the authenticated user's active project slots:
 * how many they can own (level-based, 2 → 5), how many they're using
 * (non-completed projects they created), and which projects those are.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload = {};
    try { payload = await req.json(); } catch (_) { /* no body */ }
    const email = payload.user_email || user.email;

    const statsList = await base44.asServiceRole.entities.UserGameStats.filter({ user_email: email });
    const level = statsList && statsList.length > 0 ? (statsList[0].level || 1) : 1;
    const capacity = slotCapacityForLevel(level);

    const ownedProjects = await base44.asServiceRole.entities.Project.filter({ created_by: email });
    const active = (ownedProjects || []).filter(p => p.status !== 'completed');

    return Response.json({
      level,
      capacity,
      activeCount: active.length,
      freeSlots: Math.max(0, capacity - active.length),
      activeProjects: active.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        last_activity_at: p.last_activity_at || p.created_date
      }))
    });

  } catch (error) {
    console.error('Error fetching project slots:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});