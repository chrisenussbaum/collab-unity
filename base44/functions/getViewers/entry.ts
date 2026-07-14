import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Returns the recent viewer details for the current authenticated user.
 * Only the profile owner can retrieve their own viewer lists.
 *
 * If viewer_details are empty but dedup keys exist (from views tracked before
 * the viewer-details feature), this function backfills the details by looking
 * up the viewer emails from the dedup keys.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the full user record (service role to get all fields)
    const users = await base44.asServiceRole.entities.User.filter({ email: currentUser.email });
    const user = users?.[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    let profileViewerDetails = user.profile_viewer_details || [];
    let projectViewerDetails = user.project_viewer_details || [];
    const profileDedupKeys = user.recent_profile_viewers || [];
    const projectDedupKeys = user.recent_project_viewers || [];

    const needsProfileBackfill = profileDedupKeys.length > 0 &&
      profileViewerDetails.length < profileDedupKeys.filter(k => !k.startsWith('anon:')).length;
    const needsProjectBackfill = projectDedupKeys.length > 0 &&
      projectViewerDetails.length < projectDedupKeys.filter(k => !k.startsWith('anon:')).length;

    // Only backfill if there are dedup keys with real viewer emails that aren't yet in details
    if (needsProfileBackfill || needsProjectBackfill) {
      const updateData = {};

      // --- Backfill profile viewer details ---
      if (needsProfileBackfill) {
        const existingEmails = new Set(profileViewerDetails.map(v => v.email));
        // Parse dedup keys: format is "viewerEmail:YYYY-MM-DD"
        const parsed = [];
        for (const key of profileDedupKeys) {
          if (key.startsWith('anon:')) continue;
          // Email is everything before the last ":YYYY-MM-DD"
          const lastColon = key.lastIndexOf(':');
          if (lastColon === -1) continue;
          const email = key.substring(0, lastColon);
          const dateStr = key.substring(lastColon + 1);
          if (email && !existingEmails.has(email)) {
            parsed.push({ email, dateStr, key });
          }
        }

        // Look up each missing viewer user
        for (const p of parsed) {
          try {
            const viewerUsers = await base44.asServiceRole.entities.User.filter({ email: p.email });
            const v = viewerUsers?.[0];
            const detail = {
              email: p.email,
              username: v?.username || "",
              full_name: v?.full_name || "",
              profile_image: v?.profile_image || "",
              viewed_at: `${p.dateStr}T00:00:00.000Z`
            };
            if (!existingEmails.has(p.email)) {
              profileViewerDetails.push(detail);
              existingEmails.add(p.email);
            }
          } catch (_) { /* skip on error */ }
        }

        // Sort by viewed_at descending (most recent first), keep latest 50
        profileViewerDetails.sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime());
        updateData.profile_viewer_details = profileViewerDetails.slice(0, 50);
      }

      // --- Backfill project viewer details ---
      if (needsProjectBackfill) {
        // For project viewers, dedup by email+project_id combination
        const existingKeys = new Set(projectViewerDetails.map(v => `${v.email}:${v.project_id}`));
        const parsed = [];
        for (const key of projectDedupKeys) {
          if (key.startsWith('anon:')) continue;
          // Format: "viewerEmail:projectId:YYYY-MM-DD"
          const lastColon = key.lastIndexOf(':');
          if (lastColon === -1) continue;
          const dateStr = key.substring(lastColon + 1);
          const rest = key.substring(0, lastColon);
          // rest = "viewerEmail:projectId" — split on first colon
          const firstColon = rest.indexOf(':');
          if (firstColon === -1) continue;
          const email = rest.substring(0, firstColon);
          const projectId = rest.substring(firstColon + 1);
          if (email && projectId && !existingKeys.has(`${email}:${projectId}`)) {
            parsed.push({ email, projectId, dateStr, key });
          }
        }

        // Collect unique emails to look up
        const emailsToLookup = [...new Set(parsed.map(p => p.email))];
        const userMap = {};
        for (const email of emailsToLookup) {
          try {
            const viewerUsers = await base44.asServiceRole.entities.User.filter({ email });
            const v = viewerUsers?.[0];
            if (v) userMap[email] = v;
          } catch (_) { /* skip on error */ }
        }

        // Also look up project titles
        const projectIds = [...new Set(parsed.map(p => p.projectId))];
        const projectMap = {};
        for (const pid of projectIds) {
          try {
            const proj = await base44.asServiceRole.entities.Project.get(pid);
            if (proj) projectMap[pid] = proj.title;
          } catch (_) { /* skip on error */ }
        }

        for (const p of parsed) {
          const v = userMap[p.email];
          const detail = {
            email: p.email,
            username: v?.username || "",
            full_name: v?.full_name || "",
            profile_image: v?.profile_image || "",
            viewed_at: `${p.dateStr}T00:00:00.000Z`,
            project_id: p.projectId,
            project_title: projectMap[p.projectId] || ""
          };
          if (!existingKeys.has(`${p.email}:${p.projectId}`)) {
            projectViewerDetails.push(detail);
            existingKeys.add(`${p.email}:${p.projectId}`);
          }
        }

        // Sort by viewed_at descending, keep latest 100
        projectViewerDetails.sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime());
        updateData.project_viewer_details = projectViewerDetails.slice(0, 100);
      }

      // Persist the backfilled data
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.User.update(user.id, updateData);
      }
    }

    // Sort before returning to ensure most recent first
    profileViewerDetails.sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime());
    projectViewerDetails.sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime());

    return Response.json({
      profile_viewers: profileViewerDetails,
      project_viewers: projectViewerDetails,
      profile_views: user.profile_views || 0,
      project_views: user.project_views || 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});