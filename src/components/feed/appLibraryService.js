/**
 * Shared service for the Library of Apps — used by both the desktop
 * (LibraryOfApps) and mobile (LibraryOfAppsMobile) components so they
 * undergo the exact same fetch, dedup, and cache process.
 */
import { base44 } from "@/api/base44Client";
import { deduplicateApps } from "@/components/feed/knownAppCategories";

export const CACHE_KEY = (email) => `cu_app_library_v4_${email}`;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getFaviconUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${hostname}`;
  } catch {
    return null;
  }
}

export function getLogoUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return `https://logo.clearbit.com/${hostname}`;
  } catch {
    return null;
  }
}

export function getCachedApps(email) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(email));
    if (!raw) return null;
    const { timestamp, apps } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return apps;
  } catch {
    return null;
  }
}

export function setCachedApps(email, apps) {
  try {
    localStorage.setItem(
      CACHE_KEY(email),
      JSON.stringify({ timestamp: Date.now(), apps })
    );
  } catch {}
}

/**
 * Fetches tailored app recommendations from the LLM, applies the
 * authoritative category map, deduplicates by name, and attaches
 * logo/favicon URLs. Identical for desktop and mobile.
 */
export async function fetchTailoredApps(currentUser) {
  const skills = currentUser?.skills || [];
  const interests = currentUser?.interests || [];
  const tools = currentUser?.tools_technologies || [];
  const industry = currentUser?.industry || "";

  const profileParts = [];
  if (skills.length) profileParts.push(`Skills: ${skills.join(", ")}`);
  if (interests.length) profileParts.push(`Interests: ${interests.join(", ")}`);
  if (tools.length) profileParts.push(`Current tools: ${tools.join(", ")}`);
  if (industry) profileParts.push(`Industry: ${industry}`);

  const profileClause = profileParts.length
    ? `The user's profile: ${profileParts.join("; ")}. Recommend apps that are highly relevant to this user's skills, interests, and field. Include some apps they likely already use and some they should discover.`
    : "Recommend a broad mix of popular productivity, design, development, and communication apps.";

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an app discovery curator for Collab Unity, a collaboration platform. ${profileClause}

Return 24 real, well-known software apps, tools, or platforms that this user should test, learn about, or use. For each app provide:
- name: the app's name
- category: one of these exact categories: "Communication Tools", "Design Tools", "Development", "Productivity", "Project Management", "AI Tools", "Marketing", "Analytics", "File Storage", "No-Code", "Video Editing", "Social Media"
- description: a compelling 1-2 sentence description of what the app does and why the user should try it
- website_url: the official website URL (e.g. https://slack.com)

Make sure each category has at least 2 apps. Vary the selection so it's not just the most obvious choices — include some up-and-coming or lesser-known tools alongside mainstream ones. Spread apps evenly across all categories. CRITICAL: Assign each app to its single most accurate primary category based on what the app is primarily known for. For example: Discord, Slack, and Zoom are "Communication Tools"; Figma and Canva are "Design Tools"; GitHub and Docker are "Development"; Google Analytics and Amplitude are "Analytics". Do NOT duplicate an app under multiple categories.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        apps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              website_url: { type: "string" },
            },
          },
        },
      },
    },
  });

  return deduplicateApps(result?.apps || []).map((app) => ({
    ...app,
    logo_url: getLogoUrl(app.website_url),
    favicon_url: getFaviconUrl(app.website_url),
  }));
}