import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);

  // Allow scheduled calls or admin users only
  try {
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // No user context — called from scheduler, allow
  }

  // --- Refresh Learning Resources ---
  const learningResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a learning resource curator for a collaborative project platform for creators and entrepreneurs.
Generate 12 high-quality, real learning resources that are currently relevant and useful.
Cover a mix of: Design, Development, Business, Marketing, Creative, Leadership, Productivity.
For each include: title, url (real working URL), category (one of the above), format (Video/Article/Course/AudioBook/Workshop), description (one sentence), difficulty (Beginner/Intermediate/Advanced), duration (e.g. "4 hrs", "30 min"), free (boolean).
Vary the formats and difficulty levels. Prefer free resources where possible.`,
    response_json_schema: {
      type: "object",
      properties: {
        resources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              category: { type: "string" },
              format: { type: "string" },
              description: { type: "string" },
              difficulty: { type: "string" },
              duration: { type: "string" },
              free: { type: "boolean" }
            }
          }
        }
      }
    }
  });

  // --- Refresh News Sources ---
  const newsResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a news curation expert for creators and entrepreneurs.
Generate 12 curated news source entries covering: Tech, Business, Design, Entertainment, Sports, Science.
For each include: name (publication name), url (homepage URL), category (one of: Tech/Business/Design/Entertainment/Sports/Science), description (short tagline, max 8 words), color (a Tailwind CSS bg+border class pair like "bg-green-50 border-green-200").
Include a mix of well-known and lesser-known but high-quality sources. Make them diverse and relevant to creators.`,
    response_json_schema: {
      type: "object",
      properties: {
        sources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              url: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              color: { type: "string" }
            }
          }
        }
      }
    }
  });

  // Clear old records and insert new ones
  const oldResources = await base44.asServiceRole.entities.LearningResource.list();
  for (const r of oldResources) {
    await base44.asServiceRole.entities.LearningResource.delete(r.id);
  }

  const oldSources = await base44.asServiceRole.entities.NewsSource.list();
  for (const s of oldSources) {
    await base44.asServiceRole.entities.NewsSource.delete(s.id);
  }

  const newResources = learningResult?.resources || [];
  for (const r of newResources) {
    if (!r.title || !r.url || !r.category) continue;
    await base44.asServiceRole.entities.LearningResource.create({
      title: r.title,
      url: r.url,
      category: r.category,
      format: r.format || "Article",
      description: r.description || "",
      difficulty: r.difficulty || "Beginner",
      duration: r.duration || "",
      free: r.free ?? true
    });
  }

  const newSources = newsResult?.sources || [];
  for (const s of newSources) {
    if (!s.name || !s.url || !s.category) continue;
    await base44.asServiceRole.entities.NewsSource.create({
      name: s.name,
      url: s.url,
      category: s.category,
      description: s.description || "",
      color: s.color || "bg-gray-50 border-gray-200"
    });
  }

  return Response.json({
    success: true,
    resources_created: newResources.length,
    sources_created: newSources.length
  });
  } catch (error) {
    console.error('refreshDiscoverContent error:', error?.message, error?.stack);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});