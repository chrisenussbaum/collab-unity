import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Marks a stale project as active again (owner or collaborator only).
 *
 * Called when a member opens the project workspace or edits the project:
 * clears the stale flags and refreshes last_activity_at.
 * No-ops when the project isn't stale.
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

    const isMember = project.created_by === user.email ||
      (project.collaborator_emails || []).includes(user.email);
    if (!isMember) {
      return Response.json({ error: 'Only project members can revive a project' }, { status: 403 });
    }

    if (!project.is_stale && !project.stale_hidden) {
      return Response.json({ success: true, revived: false });
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Project.update(project_id, {
      is_stale: false,
      stale_hidden: false,
      last_activity_at: now
    });

    return Response.json({ success: true, revived: true });

  } catch (error) {
    console.error('Error touching project activity:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});