import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Marks a project as completed (owner only).
 *
 * Verifies at least one milestone is actually finished before freeing the
 * active project slot, clears stale flags, awards the big completion bonus
 * (plus the Finisher badges via awardPoints), and logs the status change.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return Response.json({ error: 'Missing required field: project_id' }, { status: 400 });
    }

    let project = null;
    try {
      const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      project = projects && projects[0];
    } catch (e) {
      project = null;
    }
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only the owner can complete a project
    if (project.created_by !== user.email) {
      return Response.json({ error: 'Only the project owner can mark it completed' }, { status: 403 });
    }

    if (project.status === 'completed') {
      return Response.json({ success: true, already_completed: true });
    }

    // Completion requires real progress: at least one finished milestone
    const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ project_id });
    const hasCompletedMilestone = (milestones || []).some(m => m.status === 'completed');
    if (!hasCompletedMilestone) {
      return Response.json(
        { error: 'no_completed_milestones', message: 'Finish at least one milestone before marking this project completed.' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Project.update(project_id, {
      status: 'completed',
      last_activity_at: now,
      is_stale: false,
      stale_hidden: false
    });

    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        project_id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        action_type: 'status_changed',
        action_description: `Marked "${project.title}" as completed`,
        entity_type: 'project',
        entity_id: project_id
      });
    } catch (e) {
      console.warn('Could not log completion activity:', e);
    }

    // Award the completion bonus + Finisher badges
    let award = null;
    try {
      const res = await base44.functions.invoke('awardPoints', {
        action: 'project_completed',
        user_email: user.email
      });
      award = res && res.data ? res.data : res;
    } catch (e) {
      console.warn('Could not award completion points:', e);
    }

    return Response.json({ success: true, award });

  } catch (error) {
    console.error('Error completing project:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});