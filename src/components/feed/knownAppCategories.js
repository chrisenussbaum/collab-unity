/**
 * Authoritative category mapping for well-known apps so the LLM can't
 * misclassify them (e.g. Discord must always be "Communication Tools").
 * Keyed by lowercased app name.
 */
export const KNOWN_APP_CATEGORIES = {
  // Communication Tools
  "discord": "Communication Tools",
  "slack": "Communication Tools",
  "microsoft teams": "Communication Tools",
  "teams": "Communication Tools",
  "zoom": "Communication Tools",
  "google meet": "Communication Tools",
  "skype": "Communication Tools",
  "whatsapp": "Communication Tools",
  "telegram": "Communication Tools",
  "signal": "Communication Tools",
  "webex": "Communication Tools",
  "guilded": "Communication Tools",
  "lark": "Communication Tools",

  // Design Tools
  "figma": "Design Tools",
  "adobe photoshop": "Design Tools",
  "photoshop": "Design Tools",
  "adobe illustrator": "Design Tools",
  "illustrator": "Design Tools",
  "adobe xd": "Design Tools",
  "canva": "Design Tools",
  "sketch": "Design Tools",
  "affinity designer": "Design Tools",
  "affinity photo": "Design Tools",
  "affinity publisher": "Design Tools",
  "invision": "Design Tools",
  "framer": "Design Tools",
  "dribbble": "Design Tools",
  "behance": "Design Tools",
  "procreate": "Design Tools",
  "gimp": "Design Tools",
  "penpot": "Design Tools",

  // Development
  "github": "Development",
  "gitlab": "Development",
  "vs code": "Development",
  "visual studio code": "Development",
  "jetbrains": "Development",
  "intellij idea": "Development",
  "webstorm": "Development",
  "pycharm": "Development",
  "docker": "Development",
  "stackoverflow": "Development",
  "stack overflow": "Development",
  "replit": "Development",
  "vercel": "Development",
  "netlify": "Development",
  "postman": "Development",
  "git": "Development",
  "gitkraken": "Development",
  "sourcetree": "Development",
  "codepen": "Development",
  "codesandbox": "Development",

  // Productivity
  "notion": "Productivity",
  "evernote": "Productivity",
  "todoist": "Productivity",
  "things": "Productivity",
  "things 3": "Productivity",
  "ticktick": "Productivity",
  "obsidian": "Productivity",
  "roam research": "Productivity",
  "grammarly": "Productivity",
  "1password": "Productivity",
  "lastpass": "Productivity",
  "raycast": "Productivity",
  "alfred": "Productivity",
  "fantastical": "Productivity",

  // Project Management
  "trello": "Project Management",
  "asana": "Project Management",
  "clickup": "Project Management",
  "monday.com": "Project Management",
  "jira": "Project Management",
  "linear": "Project Management",
  "basecamp": "Project Management",
  "airtable": "Project Management",
  "smartsheet": "Project Management",
  "wrike": "Project Management",
  "height": "Project Management",
  "shortcut": "Project Management",
  " clubhouse": "Project Management",

  // AI Tools
  "chatgpt": "AI Tools",
  "openai": "AI Tools",
  "claude": "AI Tools",
  "anthropic": "AI Tools",
  "midjourney": "AI Tools",
  "stable diffusion": "AI Tools",
  "jasper": "AI Tools",
  "copy.ai": "AI Tools",
  "perplexity": "AI Tools",
  "gemini": "AI Tools",
  "hugging face": "AI Tools",
  "huggingface": "AI Tools",
  "replicate": "AI Tools",
  "elevenlabs": "AI Tools",
  "runway": "AI Tools",
  "gamma": "AI Tools",
  "tome": "AI Tools",

  // Marketing
  "mailchimp": "Marketing",
  "hubspot": "Marketing",
  "ahrefs": "Marketing",
  "semrush": "Marketing",
  "moz": "Marketing",
  "buffer": "Marketing",
  "hootsuite": "Marketing",
  "unbounce": "Marketing",
  "google ads": "Marketing",
  "convertkit": "Marketing",
  "brevo": "Marketing",
  "sendinblue": "Marketing",
  "klaviyo": "Marketing",

  // Analytics
  "google analytics": "Analytics",
  "amplitude": "Analytics",
  "mixpanel": "Analytics",
  "hotjar": "Analytics",
  "tableau": "Analytics",
  "looker": "Analytics",
  "power bi": "Analytics",
  "segment": "Analytics",
  "posthog": "Analytics",
  "chartmogul": "Analytics",
  "plausible": "Analytics",
  "matomo": "Analytics",

  // File Storage
  "google drive": "File Storage",
  "dropbox": "File Storage",
  "onedrive": "File Storage",
  "box": "File Storage",
  "icloud": "File Storage",
  "mega": "File Storage",
  "pcloud": "File Storage",
  "backblaze": "File Storage",

  // No-Code
  "bubble": "No-Code",
  "webflow": "No-Code",
  "zapier": "No-Code",
  "make": "No-Code",
  "integromat": "No-Code",
  "softr": "No-Code",
  "glide": "No-Code",
  "adalo": "No-Code",
  "flutterflow": "No-Code",
  "retool": "No-Code",
  "carrd": "No-Code",
  "memberstack": "No-Code",

  // Video Editing
  "adobe premiere pro": "Video Editing",
  "premiere pro": "Video Editing",
  "final cut pro": "Video Editing",
  "davinci resolve": "Video Editing",
  "imovie": "Video Editing",
  "capcut": "Video Editing",
  "filmora": "Video Editing",
  "after effects": "Video Editing",
  "adobe after effects": "Video Editing",
  "descript": "Video Editing",
  "screenflow": "Video Editing",

  // Social Media
  "instagram": "Social Media",
  "twitter": "Social Media",
  "x": "Social Media",
  "facebook": "Social Media",
  "linkedin": "Social Media",
  "tiktok": "Social Media",
  "youtube": "Social Media",
  "pinterest": "Social Media",
  "reddit": "Social Media",
  "snapchat": "Social Media",
  "twitch": "Social Media",
  "threads": "Social Media",
  "discord app": "Communication Tools",

  // Adobe general entries (LLM may return "Adobe" or "Adobe Creative Cloud")
  "adobe": "Design Tools",
  "adobe creative cloud": "Design Tools",
  "adobe express": "Design Tools",
  "adobe indesign": "Design Tools",
  "indesign": "Design Tools",
  "adobe lightroom": "Design Tools",
  "lightroom": "Design Tools",
  "adobe firefly": "Design Tools",
  "firefly": "Design Tools",
  "adobe acrobat": "Design Tools",
  "acrobat": "Design Tools",
  "adobe portfolio": "Design Tools",
  "adobe stock": "Design Tools",

  // Additional Development tools
  "bitbucket": "Development",
  "heroku": "Development",
  "digitalocean": "Development",
  "aws": "Development",
  "amazon web services": "Development",
  "azure": "Development",
  "microsoft azure": "Development",
  "google cloud": "Development",
  "google cloud platform": "Development",
  "firebase": "Development",
  "supabase": "Development",
  "cloudflare": "Development",
  "nginx": "Development",
  "node.js": "Development",
  "nodejs": "Development",
  "npm": "Development",
  "yarn": "Development",
  "webpack": "Development",
  "vite": "Development",
  "tailwind css": "Development",
  "tailwind": "Development",
  "bootstrap": "Development",
  "react": "Development",
  "react.js": "Development",
  "vue": "Development",
  "vue.js": "Development",
  "angular": "Development",
  "svelte": "Development",
  "next.js": "Development",
  "nextjs": "Development",
  "nuxt": "Development",
  "express": "Development",
  "django": "Development",
  "flask": "Development",
  "ruby on rails": "Development",
  "rails": "Development",
  "laravel": "Development",
  "spring": "Development",
  "flutter": "Development",
  "react native": "Development",
  "xcode": "Development",
  "android studio": "Development",
  "eclipse": "Development",
  "vim": "Development",
  "neovim": "Development",
  "emacs": "Development",
  "sublime text": "Development",
  "atom": "Development",
  "insomnia": "Development",
  "swagger": "Development",
  "graphql": "Development",
  "prisma": "Development",
  "mongodb": "Development",
  "mysql": "Development",
  "postgresql": "Development",
  "redis": "Development",
  "sqlite": "Development",
  "supabase": "Development",
  "kubernetes": "Development",
  "terraform": "Development",
  "ansible": "Development",
  "jenkins": "Development",
  "circleci": "Development",
  "github actions": "Development",
  "linode": "Development",
  "vultr": "Development",
  "render": "Development",
  "fly.io": "Development",
  "railway": "Development",
  "glitch": "Development",
  "stackblitz": "Development",

  // Additional Productivity tools
  "notion ai": "Productivity",
  "google keep": "Productivity",
  "microsoft onenote": "Productivity",
  "onenote": "Productivity",
  "apple notes": "Productivity",
  "bear": "Productivity",
  "ulysses": "Productivity",
  "focusmate": "Productivity",
  "rescue time": "Productivity",
  "rescuetime": "Productivity",
  "toggl": "Productivity",
  "clockify": "Productivity",
  "harvest": "Productivity",
  "calendly": "Productivity",
  "1password": "Productivity",
  "bitwarden": "Productivity",
  "dashlane": "Productivity",
  "textexpander": "Productivity",
  "rectangle": "Productivity",
  "magnet": "Productivity",
  "notion calendar": "Productivity",
  "cron": "Productivity",
  "amie": "Productivity",
  "things 3": "Productivity",
  "omnifocus": "Productivity",
  "taskade": "Productivity",
  "anytype": "Productivity",
  "capacities": "Productivity",
  "tana": "Productivity",
  "heptabase": "Productivity",
  "logseq": "Productivity",
  "reflect": "Productivity",
  "remnote": "Productivity",
  "sunsama": "Productivity",
  "motion": "Productivity",
  "reclaim": "Productivity",
  "akiflow": "Productivity",
  "superhuman": "Productivity",

  // Additional Project Management
  "teamwork": "Project Management",
  "proofhub": "Project Management",
  "ganttpro": "Project Management",
  "teamgantt": "Project Management",
  "liquidplanner": "Project Management",
  "forecast": "Project Management",
  "hive": "Project Management",
  "nutcache": "Project Management",
  "backlog": "Project Management",
  "zenhub": "Project Management",
  "github projects": "Project Management",
  "confluence": "Project Management",
  "smartsheet": "Project Management",
  "podio": "Project Management",
  "freedcamp": "Project Management",
  "clickup": "Project Management",
  "flow": "Project Management",
  "leankit": "Project Management",
  "targetprocess": "Project Management",
  "asana": "Project Management",
  "trello": "Project Management",
};

/**
 * Returns the authoritative category for a known app, or the LLM-assigned
 * category if the app is not in the known map.
 */
export function getAuthoritativeCategory(app) {
  const key = normalizeName(app.name);
  return KNOWN_APP_CATEGORIES[key] || app.category;
}

/**
 * Normalizes an app name for deduplication: lowercase, trim, remove common
 * suffixes like "app", "tool", "software", "inc", "the".
 */
function normalizeName(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+(app|tool|tools|software|inc|the)\s*$/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Takes a list of apps from the LLM, applies the authoritative category to
 * each, and deduplicates by normalized name so no app appears more than once
 * (preventing the same app from showing up under multiple categories).
 * Keeps the first occurrence when duplicates are found.
 */
export function deduplicateApps(apps) {
  const seen = new Set();
  const result = [];
  let id = 0;
  for (const app of apps || []) {
    const key = normalizeName(app.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({
      ...app,
      category: getAuthoritativeCategory(app),
      id: `app-${id++}`,
    });
  }
  return result;
}