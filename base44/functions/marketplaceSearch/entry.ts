import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body = {};
    try {
      body = await req.json();
    } catch (_e) {
      // empty body is fine — return all profiles
    }

    const {
      search = '',
      skills = [],
      minRating = 0,
      hasActiveProjects = false,
      excludeEmail = '',
      page = 1,
      limit = 24,
    } = body as any;

    // Fetch all public users (with username, name, and profile image)
    const allUsers = await base44.asServiceRole.entities.User.list();

    const DEFAULT_COVER = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/cd4694e0a_purple-background.jpg';

    const publicUsers = (allUsers || []).filter(u => {
      if (excludeEmail && u.email === excludeEmail) return false;
      return u.username && u.username.trim() !== ''
        && u.full_name && u.full_name.trim() !== ''
        && u.profile_image && u.profile_image.trim() !== '';
    });

    // Fetch all collaborator reviews to compute average ratings
    const allReviews = await base44.asServiceRole.entities.CollaboratorReview.list();

    // Build rating map: email -> { avg, count }
    const ratingMap: Record<string, { avg: number; count: number }> = {};
    for (const review of allReviews || []) {
      const email = review.reviewee_email;
      if (!email) continue;
      if (!ratingMap[email]) {
        ratingMap[email] = { avg: 0, count: 0, sum: 0 };
      }
      ratingMap[email].sum += review.overall_rating || 0;
      ratingMap[email].count += 1;
    }
    for (const email of Object.keys(ratingMap)) {
      const r = ratingMap[email];
      r.avg = r.count > 0 ? Math.round((r.sum / r.count) * 10) / 10 : 0;
      delete (r as any).sum;
    }

    // Fetch all non-archived projects to compute project counts
    const allProjects = await base44.asServiceRole.entities.Project.filter({ is_archived: false });

    // Build project count map: email -> { total, active, bounty }
    const projectMap: Record<string, { total: number; active: number; bounty: number }> = {};
    for (const project of allProjects || []) {
      const collabs = project.collaborator_emails || [];
      const isBounty = project.bounty_amount && project.bounty_amount > 0;
      const isActive = project.status === 'in_progress' || project.status === 'seeking_collaborators';
      for (const email of collabs) {
        if (!projectMap[email]) {
          projectMap[email] = { total: 0, active: 0, bounty: 0 };
        }
        projectMap[email].total += 1;
        if (isActive) projectMap[email].active += 1;
        if (isBounty) projectMap[email].bounty += 1;
      }
    }

    // Build enriched profiles
    let profiles = publicUsers.map(u => {
      const rating = ratingMap[u.email] || { avg: 0, count: 0 };
      const projects = projectMap[u.email] || { total: 0, active: 0, bounty: 0 };
      return {
        id: u.id,
        username: u.username || '',
        email: u.email,
        full_name: u.full_name || '',
        profile_image: u.profile_image || '',
        cover_image: u.cover_image || DEFAULT_COVER,
        location: u.location || '',
        bio: u.bio || '',
        skills: u.skills || [],
        interests: u.interests || [],
        tools_technologies: u.tools_technologies || [],
        website_url: u.website_url || '',
        linkedin_url: u.linkedin_url || '',
        voice_intro_url: u.voice_intro_url || '',
        last_active_at: u.last_active_at || null,
        average_rating: rating.avg,
        review_count: rating.count,
        project_count: projects.total,
        active_project_count: projects.active,
        bounty_project_count: projects.bounty,
      };
    });

    // --- Apply filters ---

    // Search filter (name, username, bio, skills)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      profiles = profiles.filter(p => {
        const haystack = [
          p.full_name, p.username, p.bio, p.location,
          ...(p.skills || []), ...(p.interests || []), ...(p.tools_technologies || [])
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    // Skills filter (user must have ALL selected skills)
    if (skills && skills.length > 0) {
      const lowerSkills = skills.map((s: string) => s.toLowerCase());
      profiles = profiles.filter(p => {
        const userSkills = (p.skills || []).map(s => s.toLowerCase());
        return lowerSkills.every((s: string) => userSkills.includes(s));
      });
    }

    // Minimum rating filter
    if (minRating && minRating > 0) {
      profiles = profiles.filter(p => p.average_rating >= minRating);
    }

    // Has active projects filter
    if (hasActiveProjects) {
      profiles = profiles.filter(p => p.active_project_count > 0);
    }

    // Sort: highest rated first, then most projects, then name
    profiles.sort((a, b) => {
      if (b.average_rating !== a.average_rating) return b.average_rating - a.average_rating;
      if (b.project_count !== a.project_count) return b.project_count - a.project_count;
      return a.full_name.localeCompare(b.full_name);
    });

    // Pagination
    const total = profiles.length;
    const startIdx = (page - 1) * limit;
    const paged = profiles.slice(startIdx, startIdx + limit);

    // Collect all unique skills for filter suggestions
    const allSkillsSet = new Set<string>();
    for (const p of profiles) {
      for (const s of p.skills || []) {
        allSkillsSet.add(s);
      }
    }
    const availableSkills = Array.from(allSkillsSet).sort();

    return new Response(
      JSON.stringify({
        profiles: paged,
        total,
        page,
        limit,
        has_more: startIdx + limit < total,
        available_skills: availableSkills.slice(0, 100),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' } }
    );

  } catch (error) {
    console.error('Error in marketplaceSearch:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});