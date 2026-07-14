import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Tracks profile or project views.
 * - Only counts non-owner views
 * - Uses a session-based dedup key stored in the entity to avoid counting the same visitor multiple times per day
 * - For authenticated viewers, also stores viewer identity details (email, username, name, avatar) in a rolling list
 * 
 * Payload:
 *   { type: "profile", target_email: "user@email.com" }
 *   { type: "project", project_id: "abc123", owner_email: "owner@email.com", project_title: "My Project" }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get current user (may be null for unauthenticated visitors)
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch (_) {
      // Not authenticated - still count the view
    }

    const body = await req.json();
    const { type, target_email, project_id, owner_email, project_title } = body;

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
      const alreadyCounted = recentViewers.includes(dedupKey);

      const updateData = {};

      if (!alreadyCounted) {
        // Keep only last 500 dedup entries to avoid unbounded growth
        const updatedViewers = [...recentViewers, dedupKey].slice(-500);
        const newCount = (user.profile_views || 0) + 1;
        updateData.profile_views = newCount;
        updateData.recent_profile_viewers = updatedViewers;
      }

      // Always record viewer details for authenticated viewers (most recent first, dedup by email)
      if (currentUser?.email) {
        const existingDetails = user.profile_viewer_details || [];
        const filtered = existingDetails.filter(v => v.email !== currentUser.email);
        const viewerDetail = {
          email: currentUser.email,
          username: currentUser.username || "",
          full_name: currentUser.full_name || "",
          profile_image: currentUser.profile_image || "",
          viewed_at: new Date().toISOString()
        };
        updateData.profile_viewer_details = [viewerDetail, ...filtered].slice(0, 50);
      }

      // Only update if there's something to write
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.User.update(user.id, updateData);
      }

      return Response.json({ counted: !alreadyCounted });

    } else if (type === "project") {
      if (!project_id || !owner_email) return Response.json({ error: "project_id and owner_email required" }, { status: 400 });

      const users = await base44.asServiceRole.entities.User.filter({ email: owner_email });
      const user = users?.[0];
      if (!user) return Response.json({ error: "User not found" }, { status: 404 });

      const recentViewers = user.recent_project_viewers || [];
      const dedupKey = `${viewerKey}:${project_id}:${today}`;
      const alreadyCounted = recentViewers.includes(dedupKey);

      const updateData = {};

      if (!alreadyCounted) {
        const updatedViewers = [...recentViewers, dedupKey].slice(-500);
        const newCount = (user.project_views || 0) + 1;
        updateData.project_views = newCount;
        updateData.recent_project_viewers = updatedViewers;
      }

      // Always record viewer details for authenticated viewers (dedup by email+project_id)
      if (currentUser?.email) {
        const existingDetails = user.project_viewer_details || [];
        const filtered = existingDetails.filter(v => !(v.email === currentUser.email && v.project_id === project_id));
        const viewerDetail = {
          email: currentUser.email,
          username: currentUser.username || "",
          full_name: currentUser.full_name || "",
          profile_image: currentUser.profile_image || "",
          viewed_at: new Date().toISOString(),
          project_id: project_id,
          project_title: project_title || ""
        };
        updateData.project_viewer_details = [viewerDetail, ...filtered].slice(0, 100);
      }

      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.User.update(user.id, updateData);
      }

      return Response.json({ counted: !alreadyCounted });

    } else {
      return Response.json({ error: "Invalid type. Use 'profile' or 'project'." }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});