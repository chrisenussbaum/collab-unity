import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Tracks profile or project views.
 * - Only counts non-owner views
 * - Uses a session-based dedup key stored in the entity to avoid counting the same visitor multiple times per day
 * 
 * Payload:
 *   { type: "profile", target_email: "user@email.com" }
 *   { type: "project", project_id: "abc123", owner_email: "owner@email.com" }
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get current user (may be null for unauthenticated visitors)
  let currentUser = null;
  try {
    currentUser = await base44.auth.me();
  } catch (_) {
    // Not authenticated - still count the view
  }

  const { type, target_email, project_id, owner_email } = await req.json();

  // Don't count owner's own views
  if (type === "profile" && currentUser?.email === target_email) {
    return Response.json({ counted: false, reason: "owner_view" });
  }
  if (type === "project" && currentUser?.email === owner_email) {
    return Response.json({ counted: false, reason: "owner_view" });
  }

  // Build a dedup key: viewer identity + target + day
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const viewerKey = currentUser?.email || req.headers.get("cf-connecting-ip") || "anon";

  if (type === "profile") {
    if (!target_email) return Response.json({ error: "target_email required" }, { status: 400 });

    // Fetch the target user's current view data
    const users = await base44.asServiceRole.entities.User.filter({ email: target_email });
    const user = users?.[0];
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // Check dedup: store recent viewer keys in a small rolling array
    const recentViewers = user.recent_profile_viewers || [];
    const dedupKey = `${viewerKey}:${today}`;
    if (recentViewers.includes(dedupKey)) {
      return Response.json({ counted: false, reason: "already_counted_today" });
    }

    // Keep only last 500 entries to avoid unbounded growth
    const updatedViewers = [...recentViewers, dedupKey].slice(-500);
    const newCount = (user.profile_views || 0) + 1;

    await base44.asServiceRole.entities.User.update(user.id, {
      profile_views: newCount,
      recent_profile_viewers: updatedViewers
    });

    return Response.json({ counted: true, new_count: newCount });

  } else if (type === "project") {
    if (!project_id || !owner_email) return Response.json({ error: "project_id and owner_email required" }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.filter({ email: owner_email });
    const user = users?.[0];
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const recentViewers = user.recent_project_viewers || [];
    const dedupKey = `${viewerKey}:${project_id}:${today}`;
    if (recentViewers.includes(dedupKey)) {
      return Response.json({ counted: false, reason: "already_counted_today" });
    }

    const updatedViewers = [...recentViewers, dedupKey].slice(-500);
    const newCount = (user.project_views || 0) + 1;

    await base44.asServiceRole.entities.User.update(user.id, {
      project_views: newCount,
      recent_project_viewers: updatedViewers
    });

    return Response.json({ counted: true, new_count: newCount });

  } else {
    return Response.json({ error: "Invalid type. Use 'profile' or 'project'." }, { status: 400 });
  }
});