import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2, FileText, Video, Music, Palette, Globe, BookOpen,
  ExternalLink, Plus, Hammer, Layers, PenTool, Gamepad2, Database,
  Eye, Search, RefreshCw, AlertTriangle, ArrowRight, X, Sparkles,
  Rocket, Map, Link2, Trash2, CheckCircle2, Circle, ChevronRight,
  Wrench, GraduationCap, Users, Lightbulb, Zap, Target, Package,
  Mic, Film, FlaskConical, BookMarked, BarChart3, Smartphone,
  Calendar, Flag, Clock, Edit2, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format, isPast, isValid, parseISO } from "date-fns";

// ─── Project type definitions ──────────────────────────────────────────────

const PROJECT_TYPES = [
  {
    id: "coding",
    label: "Coding / Software",
    icon: Code2,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    activeColor: "bg-blue-600 text-white border-blue-600",
    description: "Apps, APIs, scripts, automation",
    phases: [
      { label: "Define", steps: ["Write a clear problem statement", "Define your target users", "List core features (MVP only)", "Choose your tech stack"] },
      { label: "Design", steps: ["Sketch UI wireframes", "Design data models / schema", "Plan API endpoints", "Set up version control (GitHub)"] },
      { label: "Build", steps: ["Scaffold the project structure", "Implement core features", "Connect database / backend", "Write tests for critical paths"] },
      { label: "Ship", steps: ["Deploy to a cloud platform", "Set up a custom domain", "Add analytics / error tracking", "Write a README and docs"] },
      { label: "Grow", steps: ["Gather user feedback", "Iterate on features", "Set up CI/CD pipeline", "Monitor performance & uptime"] },
    ],
    toolCategories: [
      {
        label: "Code & Dev", icon: Code2, tools: [
          { name: "GitHub", url: "https://github.com", desc: "Version control & collaboration" },
          { name: "StackBlitz", url: "https://stackblitz.com", desc: "Instant browser IDE" },
          { name: "CodeSandbox", url: "https://codesandbox.io", desc: "Full-stack browser sandbox" },
          { name: "Replit", url: "https://replit.com", desc: "Collaborative online IDE" },
          { name: "GitLab", url: "https://gitlab.com", desc: "DevOps & CI/CD platform" },
        ]
      },
      {
        label: "Deploy", icon: Rocket, tools: [
          { name: "Vercel", url: "https://vercel.com", desc: "Frontend cloud deploy" },
          { name: "Railway", url: "https://railway.app", desc: "Backend & DB deploy" },
          { name: "Render", url: "https://render.com", desc: "Full-stack hosting" },
          { name: "Netlify", url: "https://netlify.com", desc: "Jamstack deployment" },
          { name: "Fly.io", url: "https://fly.io", desc: "Global app platform" },
        ]
      },
      {
        label: "Backend & DB", icon: Database, tools: [
          { name: "Supabase", url: "https://supabase.com", desc: "Open-source Firebase" },
          { name: "PlanetScale", url: "https://planetscale.com", desc: "Serverless MySQL" },
          { name: "MongoDB Atlas", url: "https://cloud.mongodb.com", desc: "Cloud NoSQL DB" },
          { name: "Firebase", url: "https://firebase.google.com", desc: "Google app platform" },
          { name: "Neon", url: "https://neon.tech", desc: "Serverless Postgres" },
        ]
      },
      {
        label: "Learn", icon: GraduationCap, tools: [
          { name: "MDN Web Docs", url: "https://developer.mozilla.org", desc: "Web reference" },
          { name: "freeCodeCamp", url: "https://freecodecamp.org", desc: "Free coding curriculum" },
          { name: "The Odin Project", url: "https://theodinproject.com", desc: "Full-stack curriculum" },
          { name: "Roadmap.sh", url: "https://roadmap.sh", desc: "Dev learning roadmaps" },
        ]
      },
    ],
    aiKickstarter: `You are a senior software engineer and startup advisor. The user wants to build a software project titled "{title}": {description}

Give them a concrete getting-started plan with:
1. **Recommended tech stack** (be specific: language, framework, database, hosting)
2. **Project structure** (key folders and files to create first)
3. **First 3 tasks to do today** (very specific, actionable)
4. **Biggest technical risk** and how to de-risk it
5. **One quick win** they can ship in the first week to validate the idea

Be direct, opinionated, and practical. No fluff.`,
  },
  {
    id: "design",
    label: "Design / Creative",
    icon: Palette,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    activeColor: "bg-purple-600 text-white border-purple-600",
    description: "UI/UX, branding, graphics, illustration",
    phases: [
      { label: "Research", steps: ["Define the design brief", "Research competitors & references", "Build a mood board", "Identify target audience"] },
      { label: "Concept", steps: ["Sketch rough concepts (paper first)", "Create low-fidelity wireframes", "Gather early feedback", "Choose design direction"] },
      { label: "Design", steps: ["Build a style guide (colors, fonts, spacing)", "Create high-fidelity mockups", "Design all key screens/assets", "Prototype interactions"] },
      { label: "Deliver", steps: ["Export assets in correct formats", "Write handoff documentation", "Present to stakeholders", "Collect and incorporate feedback"] },
      { label: "Iterate", steps: ["A/B test design variations", "Track user behavior metrics", "Refine based on real feedback", "Document design decisions"] },
    ],
    toolCategories: [
      {
        label: "Design Tools", icon: Palette, tools: [
          { name: "Figma", url: "https://figma.com", desc: "UI/UX design & prototyping" },
          { name: "Canva", url: "https://canva.com", desc: "Quick graphics & templates" },
          { name: "Adobe XD", url: "https://adobe.com/products/xd", desc: "UX prototyping" },
          { name: "Framer", url: "https://framer.com", desc: "Interactive prototypes" },
          { name: "Penpot", url: "https://penpot.app", desc: "Open-source design tool" },
        ]
      },
      {
        label: "Assets & Inspiration", icon: Lightbulb, tools: [
          { name: "Dribbble", url: "https://dribbble.com", desc: "Design inspiration" },
          { name: "Behance", url: "https://behance.net", desc: "Portfolio & showcase" },
          { name: "Unsplash", url: "https://unsplash.com", desc: "Free stock photos" },
          { name: "Coolors", url: "https://coolors.co", desc: "Color palette generator" },
          { name: "Google Fonts", url: "https://fonts.google.com", desc: "Free web fonts" },
        ]
      },
      {
        label: "Illustration & Icons", icon: PenTool, tools: [
          { name: "Illustrator", url: "https://adobe.com/products/illustrator", desc: "Vector graphics" },
          { name: "Procreate", url: "https://procreate.com", desc: "iPad illustration" },
          { name: "Iconoir", url: "https://iconoir.com", desc: "Open-source icon set" },
          { name: "Lottiefiles", url: "https://lottiefiles.com", desc: "Animated icons/illustrations" },
        ]
      },
    ],
    aiKickstarter: `You are a senior UX/product designer. The user wants to create a design project titled "{title}": {description}

Give them:
1. **Design brief summary** (problem, audience, key constraints)
2. **Recommended workflow** (tools + order of steps)
3. **Mood board direction** (3-5 adjectives, reference styles to look at)
4. **First 3 things to do today** (very specific)
5. **Common mistake to avoid** for this type of project

Be direct and practical. Skip generic advice.`,
  },
  {
    id: "video",
    label: "Video / Film",
    icon: Video,
    color: "bg-red-100 text-red-700 border-red-200",
    activeColor: "bg-red-600 text-white border-red-600",
    description: "Films, reels, docs, tutorials, vlogs",
    phases: [
      { label: "Pre-Production", steps: ["Write the concept / logline", "Create a script or outline", "Plan shot list and storyboard", "Organize cast, crew & locations"] },
      { label: "Production", steps: ["Set up equipment & lighting", "Record all planned shots", "Capture B-roll footage", "Record audio / voiceover"] },
      { label: "Post-Production", steps: ["Import and organize footage", "Rough cut & structure", "Color grade & audio mix", "Add titles, graphics, music"] },
      { label: "Publish", steps: ["Export in correct formats", "Write title, description & tags", "Choose platform & upload", "Share to social media"] },
      { label: "Grow", steps: ["Respond to comments", "Analyze watch metrics", "Plan follow-up content", "Build a content calendar"] },
    ],
    toolCategories: [
      {
        label: "Editing", icon: Film, tools: [
          { name: "DaVinci Resolve", url: "https://blackmagicdesign.com/products/davinciresolve", desc: "Pro-grade free editor" },
          { name: "CapCut", url: "https://capcut.com", desc: "Fast social video editing" },
          { name: "Premiere Pro", url: "https://adobe.com/products/premiere", desc: "Industry-standard editor" },
          { name: "Final Cut Pro", url: "https://apple.com/final-cut-pro", desc: "Mac-native pro editor" },
        ]
      },
      {
        label: "Collaboration & Review", icon: Users, tools: [
          { name: "Frame.io", url: "https://frame.io", desc: "Video review & feedback" },
          { name: "Loom", url: "https://loom.com", desc: "Quick video sharing" },
          { name: "YouTube Studio", url: "https://studio.youtube.com", desc: "YouTube management" },
          { name: "Notion", url: "https://notion.so", desc: "Script & project docs" },
        ]
      },
      {
        label: "Assets & Audio", icon: Mic, tools: [
          { name: "Epidemic Sound", url: "https://epidemicsound.com", desc: "Royalty-free music" },
          { name: "Artlist", url: "https://artlist.io", desc: "Music & SFX licensing" },
          { name: "Pexels Video", url: "https://pexels.com/videos", desc: "Free stock footage" },
          { name: "Canva Video", url: "https://canva.com/video-editor", desc: "Quick video graphics" },
        ]
      },
    ],
    aiKickstarter: `You are a professional video producer and content strategist. The user wants to create a video project titled "{title}": {description}

Give them:
1. **Format recommendation** (length, style, structure that works best for this content)
2. **Pre-production checklist** (5 things to prepare before hitting record)
3. **First 3 actions to take today**
4. **The hook** — suggest a powerful opening line or visual for the first 5 seconds
5. **Distribution plan** — which platforms and why

Be specific and creative. No generic tips.`,
  },
  {
    id: "music",
    label: "Music / Audio",
    icon: Music,
    color: "bg-green-100 text-green-700 border-green-200",
    activeColor: "bg-green-600 text-white border-green-600",
    description: "Tracks, albums, podcasts, sound design",
    phases: [
      { label: "Concept", steps: ["Define the genre, mood, and influences", "Set a BPM, key, and time signature", "Write lyrics or episode outline", "Create a reference playlist"] },
      { label: "Create", steps: ["Record scratch tracks / rough ideas", "Layer instruments and sounds", "Record vocals or interviews", "Structure the arrangement"] },
      { label: "Produce", steps: ["Mix levels, EQ, and compression", "Add effects and automation", "Master for target platform", "Get feedback from trusted ears"] },
      { label: "Release", steps: ["Choose a distributor (DistroKid, etc.)", "Design artwork / cover", "Write metadata and credits", "Schedule release date"] },
      { label: "Promote", steps: ["Pitch to playlists & blogs", "Post behind-the-scenes content", "Engage on social media", "Plan a live performance or listening event"] },
    ],
    toolCategories: [
      {
        label: "DAWs & Production", icon: Music, tools: [
          { name: "GarageBand", url: "https://apple.com/mac/garageband", desc: "Free Apple DAW" },
          { name: "BandLab", url: "https://bandlab.com", desc: "Free browser/mobile DAW" },
          { name: "Audacity", url: "https://audacityteam.org", desc: "Free audio editor" },
          { name: "FL Studio", url: "https://image-line.com/fl-studio", desc: "Beat production" },
          { name: "Ableton Live", url: "https://ableton.com", desc: "Pro music production" },
        ]
      },
      {
        label: "Podcast & Voice", icon: Mic, tools: [
          { name: "Spotify for Podcasters", url: "https://podcasters.spotify.com", desc: "Record & distribute podcast" },
          { name: "Descript", url: "https://descript.com", desc: "Audio/video editing w/ transcripts" },
          { name: "Zencastr", url: "https://zencastr.com", desc: "Remote podcast recording" },
          { name: "Riverside.fm", url: "https://riverside.fm", desc: "High-quality remote recording" },
        ]
      },
      {
        label: "Distribute & Grow", icon: Rocket, tools: [
          { name: "DistroKid", url: "https://distrokid.com", desc: "Music distribution to streaming" },
          { name: "SoundCloud", url: "https://soundcloud.com", desc: "Share & discover music" },
          { name: "Bandcamp", url: "https://bandcamp.com", desc: "Fan-direct music sales" },
          { name: "Splice", url: "https://splice.com", desc: "Samples & plugin rent-to-own" },
        ]
      },
    ],
    aiKickstarter: `You are a music producer and artist development coach. The user wants to create a music/audio project titled "{title}": {description}

Give them:
1. **Genre & sonic direction** (be specific: reference 2-3 artists, describe the sound)
2. **Production setup recommendation** (what gear/software to start with given likely budget)
3. **First 3 actions to take today** to start making something
4. **Song/episode structure** suggestion for this type of content
5. **Release strategy** — when and how to release for maximum impact

Be creative, specific, and encouraging.`,
  },
  {
    id: "writing",
    label: "Writing / Content",
    icon: FileText,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    activeColor: "bg-amber-600 text-white border-amber-600",
    description: "Books, articles, blogs, scripts, newsletters",
    phases: [
      { label: "Ideate", steps: ["Define your thesis or central argument", "Identify your target reader", "Outline your structure", "Research key sources and data"] },
      { label: "Draft", steps: ["Write a rough first chapter/post", "Focus on getting ideas down, not perfect prose", "Set a daily word count goal", "Use the outline as a guide, not a cage"] },
      { label: "Revise", steps: ["Read draft aloud to catch flow issues", "Cut unnecessary words ruthlessly", "Strengthen your opening hook", "Get feedback from one trusted reader"] },
      { label: "Polish", steps: ["Proofread for grammar and spelling", "Format for target platform", "Add images, captions, or examples", "Write a compelling title/headline"] },
      { label: "Publish", steps: ["Choose publishing platform", "Schedule publication time", "Write social media copy", "Respond to early reader comments"] },
    ],
    toolCategories: [
      {
        label: "Writing Tools", icon: PenTool, tools: [
          { name: "Google Docs", url: "https://docs.google.com", desc: "Cloud word processor" },
          { name: "Notion", url: "https://notion.so", desc: "Flexible writing workspace" },
          { name: "Obsidian", url: "https://obsidian.md", desc: "Knowledge base & notes" },
          { name: "Hemingway Editor", url: "https://hemingwayapp.com", desc: "Improve readability" },
          { name: "iA Writer", url: "https://ia.net/writer", desc: "Distraction-free writing" },
        ]
      },
      {
        label: "Research & Grammar", icon: BookMarked, tools: [
          { name: "Grammarly", url: "https://grammarly.com", desc: "Grammar & style check" },
          { name: "ProWritingAid", url: "https://prowritingaid.com", desc: "Deep writing analysis" },
          { name: "Zotero", url: "https://zotero.org", desc: "Research citation manager" },
          { name: "Google Scholar", url: "https://scholar.google.com", desc: "Academic papers" },
        ]
      },
      {
        label: "Publish & Distribute", icon: Globe, tools: [
          { name: "Substack", url: "https://substack.com", desc: "Newsletter & paid subscriptions" },
          { name: "Medium", url: "https://medium.com", desc: "Built-in audience platform" },
          { name: "Ghost", url: "https://ghost.org", desc: "Pro blogging & membership" },
          { name: "Beehiiv", url: "https://beehiiv.com", desc: "Newsletter growth platform" },
        ]
      },
    ],
    aiKickstarter: `You are a professional writer and editor. The user wants to create a writing/content project titled "{title}": {description}

Give them:
1. **Core argument or premise** (one crisp sentence that makes this worth reading)
2. **Recommended format & length** (and why)
3. **Outline** — 5-7 section/chapter headings with one-line descriptions
4. **First 3 actions to take today** to start writing
5. **The killer opening line** — draft one compelling first sentence

Be direct, literary, and inspiring.`,
  },
  {
    id: "game",
    label: "Game Dev",
    icon: Gamepad2,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    activeColor: "bg-orange-600 text-white border-orange-600",
    description: "Video games, board games, interactive experiences",
    phases: [
      { label: "Concept", steps: ["Define core gameplay loop (1 sentence)", "Choose genre and target platform", "Research similar games (competitor analysis)", "Write a Game Design Document (GDD)"] },
      { label: "Prototype", steps: ["Build a paper prototype or rough digital MVP", "Test core mechanic: is it fun?", "Define the win/fail conditions", "Gather playtest feedback early"] },
      { label: "Build", steps: ["Build out levels and content", "Add art, sound, and UI", "Implement save/load system", "Create tutorial or onboarding flow"] },
      { label: "Polish", steps: ["Fix critical bugs", "Balance difficulty and pacing", "Add accessibility options", "Performance optimize for target hardware"] },
      { label: "Launch", steps: ["Choose distribution platform", "Create store page and trailer", "Run a beta/early access phase", "Engage with community & press"] },
    ],
    toolCategories: [
      {
        label: "Game Engines", icon: Gamepad2, tools: [
          { name: "Unity", url: "https://unity.com", desc: "Cross-platform 2D/3D engine" },
          { name: "Unreal Engine", url: "https://unrealengine.com", desc: "AAA-quality 3D engine" },
          { name: "Godot", url: "https://godotengine.org", desc: "Free open-source engine" },
          { name: "GameMaker", url: "https://gamemaker.io", desc: "2D game focused engine" },
          { name: "Phaser", url: "https://phaser.io", desc: "Browser-based HTML5 games" },
        ]
      },
      {
        label: "Art & Assets", icon: Palette, tools: [
          { name: "Aseprite", url: "https://aseprite.org", desc: "Pixel art & animation" },
          { name: "Blender", url: "https://blender.org", desc: "Free 3D modeling" },
          { name: "Kenney Assets", url: "https://kenney.nl", desc: "Free game assets" },
          { name: "itch.io Assets", url: "https://itch.io/game-assets", desc: "Indie game asset store" },
        ]
      },
      {
        label: "Publish & Monetize", icon: Rocket, tools: [
          { name: "itch.io", url: "https://itch.io", desc: "Indie game publishing" },
          { name: "Steam", url: "https://store.steampowered.com/about", desc: "PC game storefront" },
          { name: "CrazyGames", url: "https://developer.crazygames.com", desc: "Browser game platform" },
          { name: "Unity Gaming Services", url: "https://unity.com/solutions/gaming-services", desc: "Multiplayer & analytics" },
        ]
      },
    ],
    aiKickstarter: `You are a game designer with experience in indie and AAA titles. The user wants to build a game project titled "{title}": {description}

Give them:
1. **Core game loop** (describe the moment-to-moment experience in 2-3 sentences)
2. **Recommended engine & stack** (and why it fits this specific project)
3. **Minimum viable game (MVG)** — what's the smallest version that could be fun and shippable?
4. **First 3 tasks for today** to start prototyping
5. **One unique mechanic** or twist that could make this stand out

Be creative, specific, and think like a player.`,
  },
  {
    id: "web",
    label: "Website / No-Code",
    icon: Globe,
    color: "bg-teal-100 text-teal-700 border-teal-200",
    activeColor: "bg-teal-600 text-white border-teal-600",
    description: "Websites, landing pages, SaaS, no-code apps",
    phases: [
      { label: "Plan", steps: ["Define the site's purpose and goal", "List all pages and sections needed", "Write copy drafts for key pages", "Gather brand assets (logo, colors, fonts)"] },
      { label: "Design", steps: ["Choose a template or design system", "Wireframe key pages", "Design hero section and CTAs", "Ensure mobile-first layout"] },
      { label: "Build", steps: ["Set up on chosen platform", "Build homepage and navigation", "Add all content sections", "Connect forms and integrations"] },
      { label: "Launch", steps: ["Connect custom domain", "Set up SEO basics (meta tags, sitemap)", "Test on mobile and different browsers", "Go live and announce!"] },
      { label: "Optimize", steps: ["Add Google Analytics", "Run speed tests (Core Web Vitals)", "A/B test key CTAs", "Collect user feedback"] },
    ],
    toolCategories: [
      {
        label: "No-Code Builders", icon: Globe, tools: [
          { name: "Webflow", url: "https://webflow.com", desc: "Professional visual web design" },
          { name: "Framer", url: "https://framer.com", desc: "Interactive & animated sites" },
          { name: "Wix", url: "https://wix.com", desc: "Easy drag & drop websites" },
          { name: "Squarespace", url: "https://squarespace.com", desc: "Beautiful templates" },
          { name: "Bubble", url: "https://bubble.io", desc: "No-code web apps" },
        ]
      },
      {
        label: "SEO & Marketing", icon: BarChart3, tools: [
          { name: "Google Search Console", url: "https://search.google.com/search-console", desc: "SEO monitoring" },
          { name: "Ahrefs Webmaster", url: "https://ahrefs.com/webmaster-tools", desc: "Free SEO tools" },
          { name: "Mailchimp", url: "https://mailchimp.com", desc: "Email marketing" },
          { name: "Hotjar", url: "https://hotjar.com", desc: "Heatmaps & session recordings" },
        ]
      },
      {
        label: "Domains & Hosting", icon: Package, tools: [
          { name: "Namecheap", url: "https://namecheap.com", desc: "Affordable domains" },
          { name: "Cloudflare", url: "https://cloudflare.com", desc: "CDN, DNS & security" },
          { name: "GitHub Pages", url: "https://pages.github.com", desc: "Free static hosting" },
          { name: "Vercel", url: "https://vercel.com", desc: "Fast frontend hosting" },
        ]
      },
    ],
    aiKickstarter: `You are a web strategist and conversion rate optimizer. The user wants to build a website project titled "{title}": {description}

Give them:
1. **Site architecture** (list all pages with one-line purpose for each)
2. **Platform recommendation** (specific tool/builder and why it fits this project)
3. **Hero section copy** — draft a headline + subheadline + CTA button text
4. **First 3 actions to take today**
5. **One conversion optimization tip** specific to this type of site

Be strategic and direct.`,
  },
  {
    id: "research",
    label: "Research / Study",
    icon: FlaskConical,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    activeColor: "bg-gray-700 text-white border-gray-700",
    description: "Academic research, analysis, experiments, reports",
    phases: [
      { label: "Define", steps: ["Write a clear research question", "Review existing literature", "Define scope and limitations", "Choose your methodology"] },
      { label: "Design", steps: ["Design study/experiment methodology", "Create data collection instruments", "Define success metrics", "Get IRB/ethics approval if needed"] },
      { label: "Collect", steps: ["Run experiments or gather data", "Document raw data systematically", "Conduct interviews or surveys", "Note unexpected observations"] },
      { label: "Analyze", steps: ["Clean and organize data", "Run statistical analyses", "Identify patterns and anomalies", "Compare to initial hypothesis"] },
      { label: "Share", steps: ["Write up findings and conclusions", "Create visualizations and charts", "Peer review / get feedback", "Publish or present results"] },
    ],
    toolCategories: [
      {
        label: "Research & Notes", icon: BookMarked, tools: [
          { name: "Zotero", url: "https://zotero.org", desc: "Citation & reference manager" },
          { name: "Obsidian", url: "https://obsidian.md", desc: "Knowledge base & linking" },
          { name: "Notion", url: "https://notion.so", desc: "Research documentation" },
          { name: "Google Scholar", url: "https://scholar.google.com", desc: "Academic paper search" },
        ]
      },
      {
        label: "Data & Analysis", icon: BarChart3, tools: [
          { name: "Jupyter", url: "https://jupyter.org/try", desc: "Data science notebooks" },
          { name: "Google Colab", url: "https://colab.research.google.com", desc: "Free cloud notebooks" },
          { name: "Tableau Public", url: "https://public.tableau.com", desc: "Data visualization" },
          { name: "Google Sheets", url: "https://sheets.google.com", desc: "Spreadsheet analysis" },
        ]
      },
      {
        label: "Collaboration", icon: Users, tools: [
          { name: "Miro", url: "https://miro.com", desc: "Visual research boards" },
          { name: "Overleaf", url: "https://overleaf.com", desc: "Collaborative LaTeX editor" },
          { name: "Typeform", url: "https://typeform.com", desc: "Surveys & data collection" },
          { name: "Airtable", url: "https://airtable.com", desc: "Flexible research database" },
        ]
      },
    ],
    aiKickstarter: `You are an experienced research methodologist. The user wants to pursue a research project titled "{title}": {description}

Give them:
1. **Refined research question** (make it specific, measurable, and answerable)
2. **Methodology recommendation** (qualitative, quantitative, mixed — and why)
3. **Literature starting points** — 3 key search terms and 2-3 journals to check
4. **First 3 actions to take today** to get started
5. **Common pitfall** to avoid for this type of research

Be rigorous, clear, and practically helpful.`,
  },
  {
    id: "business",
    label: "Business / Startup",
    icon: Target,
    color: "bg-rose-100 text-rose-700 border-rose-200",
    activeColor: "bg-rose-600 text-white border-rose-600",
    description: "Startups, products, services, business plans",
    phases: [
      { label: "Validate", steps: ["Define the problem you're solving", "Identify your target customer segment", "Run 5 customer discovery interviews", "Test your core assumption (cheaply)"] },
      { label: "Plan", steps: ["Write a lean business model canvas", "Define your value proposition", "Map out the competitive landscape", "Set 3-month milestones"] },
      { label: "Build MVP", steps: ["Build the smallest version that delivers value", "Get 10 paying or committed beta users", "Measure key metrics from day one", "Iterate based on feedback weekly"] },
      { label: "Launch", steps: ["Define launch channels (where are customers?)", "Create a go-to-market plan", "Set up payments and legal basics", "Announce publicly and collect signups"] },
      { label: "Scale", steps: ["Identify best-performing acquisition channel", "Build repeatable sales process", "Hire for your weakest area", "Raise funding or reinvest revenue"] },
    ],
    toolCategories: [
      {
        label: "Business Tools", icon: Target, tools: [
          { name: "Notion", url: "https://notion.so", desc: "Business wiki & planning" },
          { name: "Airtable", url: "https://airtable.com", desc: "Flexible operations database" },
          { name: "Linear", url: "https://linear.app", desc: "Product & issue tracking" },
          { name: "Loom", url: "https://loom.com", desc: "Team async communication" },
        ]
      },
      {
        label: "Marketing & Sales", icon: Rocket, tools: [
          { name: "Mailchimp", url: "https://mailchimp.com", desc: "Email marketing" },
          { name: "HubSpot CRM", url: "https://hubspot.com/products/crm", desc: "Free CRM for sales" },
          { name: "Buffer", url: "https://buffer.com", desc: "Social media scheduling" },
          { name: "Product Hunt", url: "https://producthunt.com", desc: "Launch to early adopters" },
        ]
      },
      {
        label: "Legal & Finance", icon: Package, tools: [
          { name: "Stripe", url: "https://stripe.com", desc: "Accept payments online" },
          { name: "Wave", url: "https://waveapps.com", desc: "Free accounting software" },
          { name: "Clerky", url: "https://clerky.com", desc: "Startup legal documents" },
          { name: "Wise", url: "https://wise.com", desc: "International payments" },
        ]
      },
    ],
    aiKickstarter: `You are a startup advisor and former founder. The user wants to build a business titled "{title}": {description}

Give them:
1. **Business model summary** (how it makes money, who pays, and why they would)
2. **Riskiest assumption** to test first (and how to test it in 1 week with no money)
3. **Ideal first 10 customers** — who are they exactly, where to find them
4. **First 3 actions to take today** to make progress
5. **One unfair advantage** this founder might have (based on the project description)

Be brutally honest and founder-focused.`,
  },
  {
    id: "education",
    label: "Education / Course",
    icon: GraduationCap,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    activeColor: "bg-cyan-600 text-white border-cyan-600",
    description: "Online courses, workshops, curriculums, tutorials",
    phases: [
      { label: "Plan", steps: ["Define your target student and their goal", "Write a learning outcome for each module", "Outline the full curriculum structure", "Choose your delivery format (video, text, live)"] },
      { label: "Create", steps: ["Script module 1 first", "Record or write content in batches", "Create exercises and assessments", "Build a community or feedback loop"] },
      { label: "Review", steps: ["Run a beta with 5 students", "Gather structured feedback", "Revise confusing sections", "Improve examples with real student questions"] },
      { label: "Launch", steps: ["Choose a platform (Teachable, Gumroad, etc.)", "Write sales page copy", "Set pricing and refund policy", "Announce to your audience"] },
      { label: "Grow", steps: ["Collect and display testimonials", "Create free preview content", "Set up an affiliate program", "Add new modules based on demand"] },
    ],
    toolCategories: [
      {
        label: "Course Platforms", icon: GraduationCap, tools: [
          { name: "Teachable", url: "https://teachable.com", desc: "Host and sell courses" },
          { name: "Gumroad", url: "https://gumroad.com", desc: "Simple digital product sales" },
          { name: "Podia", url: "https://podia.com", desc: "Courses + community" },
          { name: "Maven", url: "https://maven.com", desc: "Cohort-based courses" },
          { name: "Notion", url: "https://notion.so", desc: "Free text-based curriculum" },
        ]
      },
      {
        label: "Content Creation", icon: Film, tools: [
          { name: "Loom", url: "https://loom.com", desc: "Quick screen recording lessons" },
          { name: "Descript", url: "https://descript.com", desc: "Edit video by editing text" },
          { name: "Canva", url: "https://canva.com", desc: "Slide decks & worksheets" },
          { name: "Typeform", url: "https://typeform.com", desc: "Quizzes & assessments" },
        ]
      },
      {
        label: "Community & Engagement", icon: Users, tools: [
          { name: "Circle", url: "https://circle.so", desc: "Community platform" },
          { name: "Discord", url: "https://discord.com", desc: "Free community server" },
          { name: "Substack", url: "https://substack.com", desc: "Newsletter for students" },
          { name: "Calendly", url: "https://calendly.com", desc: "Office hours scheduling" },
        ]
      },
    ],
    aiKickstarter: `You are an instructional designer and online course creator. The user wants to create an educational project titled "{title}": {description}

Give them:
1. **Target student profile** (who they are, what they already know, what they want to achieve)
2. **Curriculum outline** — 5-7 modules with a title and one-line description each
3. **Best delivery format** and platform recommendation (with reasoning)
4. **First 3 actions to take today** to start creating
5. **The transformation promise** — write a one-sentence outcome students can expect

Be pedagogically sound and practically helpful.`,
  },
  {
    id: "nonprofit",
    label: "Nonprofit / Community",
    icon: Users,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    activeColor: "bg-indigo-600 text-white border-indigo-600",
    description: "Causes, charities, community organizing, advocacy",
    phases: [
      { label: "Define", steps: ["Write a clear mission statement", "Identify the community you serve", "Define the specific problem and impact goal", "Research existing organizations in this space"] },
      { label: "Structure", steps: ["Decide legal structure (nonprofit, LLC, etc.)", "Recruit founding team and advisors", "Define roles and responsibilities", "Open bank account and set up finances"] },
      { label: "Build", steps: ["Create a website and social presence", "Develop your first program or initiative", "Build relationships with potential donors/partners", "Create an email list"] },
      { label: "Fund", steps: ["Identify grant opportunities", "Set up donation page", "Plan first fundraising campaign", "Build a donor cultivation strategy"] },
      { label: "Impact", steps: ["Track and measure program outcomes", "Tell your impact stories publicly", "Report to donors and stakeholders", "Scale what's working, cut what isn't"] },
    ],
    toolCategories: [
      {
        label: "Organization & Ops", icon: Users, tools: [
          { name: "Notion", url: "https://notion.so", desc: "Team wiki & project management" },
          { name: "Airtable", url: "https://airtable.com", desc: "Program tracking & CRM" },
          { name: "Google Workspace", url: "https://workspace.google.com/nonprofits", desc: "Free for nonprofits" },
          { name: "Slack", url: "https://slack.com/intl/en-us/solutions/nonprofits", desc: "Free for nonprofits" },
        ]
      },
      {
        label: "Fundraising & Donations", icon: Target, tools: [
          { name: "Every.org", url: "https://every.org", desc: "Free nonprofit donations" },
          { name: "Donorbox", url: "https://donorbox.org", desc: "Embeddable donation forms" },
          { name: "Givebutter", url: "https://givebutter.com", desc: "Free fundraising platform" },
          { name: "Candid (Grants)", url: "https://candid.org", desc: "Grant research database" },
        ]
      },
      {
        label: "Outreach & Comms", icon: Globe, tools: [
          { name: "Mailchimp", url: "https://mailchimp.com/nonprofits", desc: "Free nonprofit email marketing" },
          { name: "Canva Nonprofits", url: "https://canva.com/canva-for-nonprofits", desc: "Free design platform" },
          { name: "Buffer", url: "https://buffer.com", desc: "Social media scheduling" },
          { name: "Squarespace", url: "https://squarespace.com/nonprofits", desc: "Website for nonprofits" },
        ]
      },
    ],
    aiKickstarter: `You are a nonprofit strategist and community organizer. The user wants to start a nonprofit/community project titled "{title}": {description}

Give them:
1. **Mission statement** — draft a crisp, compelling one-sentence mission
2. **Theory of change** — how does this project lead to real impact? (3-4 sentences)
3. **First stakeholders to engage** — who should they talk to in the first 2 weeks?
4. **First 3 actions to take today**
5. **One quick win** they can achieve in 30 days to build momentum

Be mission-driven and strategic.`,
  },
];

// ─── Embeddable platforms ───────────────────────────────────────────────────

const EMBEDDABLE_PLATFORMS = [
  { name: "StackBlitz", url: "https://stackblitz.com/edit/react", domain: "stackblitz.com" },
  { name: "CodeSandbox", url: "https://codesandbox.io/s/new", domain: "codesandbox.io" },
  { name: "Replit", url: "https://replit.com", domain: "replit.com" },
  { name: "Miro", url: "https://miro.com", domain: "miro.com" },
  { name: "Figma", url: "https://figma.com", domain: "figma.com" },
  { name: "Canva", url: "https://canva.com", domain: "canva.com" },
  { name: "BandLab", url: "https://bandlab.com", domain: "bandlab.com" },
  { name: "Jupyter", url: "https://jupyter.org/try", domain: "jupyter.org" },
  { name: "Google Colab", url: "https://colab.research.google.com", domain: "colab.research.google.com" },
  { name: "Notion", url: "https://notion.so", domain: "notion.so" },
  { name: "Loom", url: "https://loom.com", domain: "loom.com" },
  { name: "Airtable", url: "https://airtable.com", domain: "airtable.com" },
];

// ─── Roadmap component ─────────────────────────────────────────────────────

// ─── Time-to-launch countdown helper ──────────────────────────────────────

export function getLaunchCountdown(buildMilestones) {
  if (!buildMilestones?.length) return null;
  const withDates = buildMilestones
    .filter(m => m.due_date && !m.completed)
    .map(m => ({ ...m, dateObj: parseISO(m.due_date) }))
    .filter(m => isValid(m.dateObj))
    .sort((a, b) => a.dateObj - b.dateObj);
  const launchMilestone = buildMilestones.find(m => m.is_launch) || withDates[withDates.length - 1];
  if (!launchMilestone?.due_date) return null;
  const date = parseISO(launchMilestone.due_date);
  if (!isValid(date)) return null;
  const days = differenceInDays(date, new Date());
  return { days, date, label: launchMilestone.name, overdue: days < 0 };
}

// ─── Enhanced BuildRoadmap with milestone tracker ─────────────────────────

const BuildRoadmap = ({ phases, checkedSteps, onToggleStep, buildMilestones, onMilestonesChange, stepMilestoneLinks, onStepMilestoneLinkChange, canEdit }) => {
  const [activePhase, setActivePhase] = useState(0);
  const [showMilestonePanel, setShowMilestonePanel] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newMilestoneLaunch, setNewMilestoneLaunch] = useState(false);
  const [linkingStep, setLinkingStep] = useState(null); // key of step being linked

  const totalSteps = phases.reduce((a, p) => a + p.steps.length, 0);
  const completedSteps = Object.values(checkedSteps).filter(Boolean).length;
  const countdown = getLaunchCountdown(buildMilestones);

  const addMilestone = () => {
    if (!newMilestoneName.trim()) return;
    const updated = [...buildMilestones, {
      id: Date.now().toString(),
      name: newMilestoneName.trim(),
      due_date: newMilestoneDate || null,
      completed: false,
      is_launch: newMilestoneLaunch,
    }];
    onMilestonesChange(updated);
    setNewMilestoneName(""); setNewMilestoneDate(""); setNewMilestoneLaunch(false);
  };

  const toggleMilestoneComplete = (id) => {
    onMilestonesChange(buildMilestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const removeMilestone = (id) => {
    onMilestonesChange(buildMilestones.filter(m => m.id !== id));
    // Remove any step links pointing to this milestone
    const cleaned = { ...stepMilestoneLinks };
    Object.keys(cleaned).forEach(k => { if (cleaned[k] === id) delete cleaned[k]; });
    onStepMilestoneLinkChange(cleaned);
  };

  const linkStep = (stepKey, milestoneId) => {
    const updated = { ...stepMilestoneLinks };
    if (milestoneId === "") delete updated[stepKey];
    else updated[stepKey] = milestoneId;
    onStepMilestoneLinkChange(updated);
    setLinkingStep(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Time to Launch Banner ── */}
      {countdown && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${countdown.overdue ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${countdown.overdue ? 'bg-red-100' : 'bg-purple-100'}`}>
            <Rocket className={`w-5 h-5 ${countdown.overdue ? 'text-red-600' : 'text-purple-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time to Launch</p>
            <p className={`text-lg font-bold ${countdown.overdue ? 'text-red-600' : 'text-purple-700'}`}>
              {countdown.overdue ? `${Math.abs(countdown.days)} days overdue` : countdown.days === 0 ? '🚀 Launch Day!' : `${countdown.days} days`}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500 truncate max-w-[120px]">{countdown.label}</p>
            <p className="text-xs font-medium text-gray-700">{format(countdown.date, 'MMM d, yyyy')}</p>
          </div>
        </div>
      )}

      {/* ── Visual Milestone Timeline ── */}
      {buildMilestones.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><Flag className="w-3 h-3" /> Milestones</p>
            {canEdit && <button onClick={() => setShowMilestonePanel(!showMilestonePanel)} className="text-xs text-purple-600 hover:text-purple-700 font-medium">{showMilestonePanel ? 'Hide' : 'Manage'}</button>}
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gray-200 z-0" />
            <div className="space-y-2 relative z-10">
              {buildMilestones.map((m, i) => {
                const date = m.due_date ? parseISO(m.due_date) : null;
                const overdue = date && isValid(date) && isPast(date) && !m.completed;
                const linkedStepCount = Object.values(stepMilestoneLinks).filter(v => v === m.id).length;
                return (
                  <div key={m.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${m.completed ? 'bg-green-50 border-green-200 opacity-70' : overdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={() => canEdit && toggleMilestoneComplete(m.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${m.completed ? 'bg-green-500 border-green-500' : overdue ? 'border-red-400 bg-white' : 'border-gray-300 bg-white hover:border-purple-400'}`}
                    >
                      {m.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {m.is_launch && !m.completed && <Rocket className="w-3 h-3 text-purple-500" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${m.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{m.name}</span>
                        {m.is_launch && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-semibold">🚀 Launch</span>}
                        {linkedStepCount > 0 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">{linkedStepCount} steps</span>}
                      </div>
                      {date && isValid(date) && (
                        <p className={`text-xs mt-0.5 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {overdue ? '⚠ ' : ''}{format(date, 'MMM d, yyyy')} {!m.completed && `· ${Math.abs(differenceInDays(date, new Date()))} days ${differenceInDays(date, new Date()) < 0 ? 'ago' : 'away'}`}
                        </p>
                      )}
                    </div>
                    {canEdit && <button onClick={() => removeMilestone(m.id)} className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Milestone Form ── */}
      {canEdit && (showMilestonePanel || buildMilestones.length === 0) && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-purple-700">{buildMilestones.length === 0 ? '+ Add your first milestone' : 'Add milestone'}</p>
          <div className="flex gap-2">
            <Input placeholder="Milestone name (e.g. MVP Ready, Beta Launch)" value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMilestone()} className="text-sm flex-1" />
            <Input type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)} className="text-sm w-36 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={newMilestoneLaunch} onChange={e => setNewMilestoneLaunch(e.target.checked)} className="accent-purple-600" />
              Mark as launch milestone 🚀
            </label>
            <Button onClick={addMilestone} size="sm" className="cu-button text-xs" disabled={!newMilestoneName.trim()}>Add</Button>
          </div>
        </div>
      )}

      {/* ── Phase selector ── */}
      <div className="flex gap-1 flex-wrap">
        {phases.map((phase, i) => {
          const total = phase.steps.length;
          const done = phase.steps.filter((_, si) => checkedSteps[`${i}-${si}`]).length;
          const complete = done === total;
          return (
            <button key={i} onClick={() => setActivePhase(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activePhase === i ? 'bg-purple-600 text-white border-purple-600' : complete ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}>
              {complete ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>}
              {phase.label}
              <span className={`text-[10px] ${activePhase === i ? 'text-white/70' : 'opacity-60'}`}>{done}/{total}</span>
            </button>
          );
        })}
      </div>

      {/* ── Phase steps ── */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Phase {activePhase + 1}: {phases[activePhase].label}</p>
        {phases[activePhase].steps.map((step, si) => {
          const key = `${activePhase}-${si}`;
          const checked = !!checkedSteps[key];
          const linkedMilestoneId = stepMilestoneLinks[key];
          const linkedMilestone = buildMilestones.find(m => m.id === linkedMilestoneId);
          return (
            <div key={si} className={`flex items-start gap-2 p-2 rounded-lg transition-colors hover:bg-white group ${checked ? 'opacity-60' : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => onToggleStep(key)}
                className="mt-0.5 w-4 h-4 accent-purple-600 flex-shrink-0 cursor-pointer" />
              <div className="flex-1 min-w-0">
                <span className={`text-sm text-gray-800 ${checked ? 'line-through' : ''}`}>{step}</span>
                {linkedMilestone && (
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium">
                    <Flag className="w-2.5 h-2.5" />{linkedMilestone.name}
                  </span>
                )}
              </div>
              {/* Link to milestone */}
              {canEdit && buildMilestones.length > 0 && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {linkingStep === key ? (
                    <select
                      autoFocus
                      className="text-xs border border-purple-200 rounded px-1.5 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300"
                      value={linkedMilestoneId || ""}
                      onChange={e => linkStep(key, e.target.value)}
                      onBlur={() => setLinkingStep(null)}
                    >
                      <option value="">No milestone</option>
                      {buildMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => setLinkingStep(key)}
                      className="text-[10px] text-gray-300 hover:text-purple-500 flex items-center gap-0.5 font-medium">
                      <Flag className="w-3 h-3" />{linkedMilestone ? 'Re-link' : 'Link'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Overall progress ── */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Overall completion</span>
          <span>{completedSteps} / {totalSteps} steps</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  );
};

// ─── Build a rich project context string for AI prompts ────────────────────

function buildProjectContext(project) {
  const parts = [];
  if (project?.title) parts.push(`Project name: "${project.title}"`);
  if (project?.description) parts.push(`Description: ${project.description}`);
  if (project?.classification) parts.push(`Classification: ${project.classification}`);
  if (project?.industry) parts.push(`Industry: ${project.industry}`);
  if (project?.area_of_interest) parts.push(`Area of interest: ${project.area_of_interest}`);
  if (project?.location) parts.push(`Location: ${project.location}`);
  if (project?.skills_needed?.length) parts.push(`Skills needed: ${project.skills_needed.join(", ")}`);
  if (project?.tools_needed?.length) parts.push(`Tools/technologies needed: ${project.tools_needed.join(", ")}`);
  if (project?.project_type) parts.push(`Project type: ${project.project_type}`);
  if (project?.status) parts.push(`Current status: ${project.status}`);
  return parts.join("\n");
}

// ─── Auto-detect the best build type from project metadata ─────────────────

function detectBuildType(project) {
  if (!project) return null;
  const text = [
    project.title, project.description, project.industry,
    project.area_of_interest, ...(project.skills_needed || []), ...(project.tools_needed || [])
  ].join(" ").toLowerCase();

  if (/\b(react|vue|angular|node|python|javascript|typescript|api|backend|frontend|app|software|code|developer|engineer|programming|database|sql|mongodb|firebase|github|deploy|aws|docker)\b/.test(text)) return "coding";
  if (/\b(figma|design|ui|ux|brand|logo|graphic|illustrat|canva|visual|wireframe|prototype|sketch|adobe|color|typography)\b/.test(text)) return "design";
  if (/\b(video|film|youtube|reel|edit|cinemat|vlog|documentary|short film|capcut|davinci|premiere|director)\b/.test(text)) return "video";
  if (/\b(music|song|track|album|podcast|audio|beat|produce|record|soundcloud|spotify|daw|garageband|fl studio|ableton)\b/.test(text)) return "music";
  if (/\b(blog|book|write|article|newsletter|essay|content|story|script|substack|medium|copy|author|publish)\b/.test(text)) return "writing";
  if (/\b(game|unity|unreal|godot|gamemaker|pixel|level|rpg|shooter|puzzle|simulation|player|mechanic|itch\.io)\b/.test(text)) return "game";
  if (/\b(website|landing page|webflow|wix|squarespace|wordpress|no.code|nocode|framer|bubble|saas|e-commerce)\b/.test(text)) return "web";
  if (/\b(research|study|analysis|data|experiment|survey|academic|paper|hypothesis|thesis|journal|methodology|scientist)\b/.test(text)) return "research";
  if (/\b(startup|business|product|market|revenue|customer|pitch|investor|b2b|b2c|saas|enterprise|entrepreneur|founder)\b/.test(text)) return "business";
  if (/\b(course|teach|lesson|curriculum|education|learn|student|workshop|tutorial|training|instructional|cohort)\b/.test(text)) return "education";
  if (/\b(nonprofit|charity|community|volunteer|cause|advocacy|social impact|foundation|donate|mission|ngo)\b/.test(text)) return "nonprofit";

  // Fallback by classification
  const cls = project.classification;
  if (cls === "startup") return "business";
  if (cls === "educational") return "education";
  if (cls === "nonprofit") return "nonprofit";
  if (cls === "hobby") return "coding"; // reasonable default
  return null;
}

// ─── Project context banner shown at top ───────────────────────────────────

const ProjectContextBanner = ({ project, suggestedTypeId, onAccept, onDismiss }) => {
  const suggestedType = PROJECT_TYPES.find(t => t.id === suggestedTypeId);
  if (!suggestedType) return null;
  const Icon = suggestedType.icon;
  const skills = project?.skills_needed?.slice(0, 4) || [];
  const tools = project?.tools_needed?.slice(0, 4) || [];

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">We detected your project type</p>
            <p className="text-xs text-gray-500 mt-0.5">Based on your project description, skills, and tools — we think this fits best:</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-300 hover:text-gray-500 flex-shrink-0"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${suggestedType.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{suggestedType.label}</p>
          <p className="text-xs text-gray-400">{suggestedType.description}</p>
        </div>
        <Button onClick={onAccept} size="sm" className="cu-button flex-shrink-0 text-xs">
          Use This <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {(skills.length > 0 || tools.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map(s => <span key={s} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[11px] rounded-full font-medium">{s}</span>)}
          {tools.map(t => <span key={t} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[11px] rounded-full font-medium">{t}</span>)}
        </div>
      )}
    </div>
  );
};

// ─── Project tools from skills_needed / tools_needed ──────────────────────

const ProjectSkillsTools = ({ project }) => {
  const skills = project?.skills_needed || [];
  const tools = project?.tools_needed || [];
  if (!skills.length && !tools.length) return null;

  return (
    <Card className="cu-card border-purple-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600" />
          This Project's Skills & Tools
        </CardTitle>
        <CardDescription>Pulled directly from the project setup — search for these to get started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills Needed</p>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <a
                  key={skill}
                  href={`https://www.google.com/search?q=${encodeURIComponent(skill + " tutorial for beginners")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full text-xs text-purple-700 font-medium transition-all"
                >
                  <GraduationCap className="w-3 h-3" />
                  {skill}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        )}
        {tools.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tools & Technologies</p>
            <div className="flex flex-wrap gap-2">
              {tools.map(tool => (
                <a
                  key={tool}
                  href={`https://www.google.com/search?q=${encodeURIComponent(tool + " getting started")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full text-xs text-indigo-700 font-medium transition-all"
                >
                  <Wrench className="w-3 h-3" />
                  {tool}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── AI Kickstarter component ──────────────────────────────────────────────

const AIKickstarter = ({ project, selectedType }) => {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!selectedType) return;
    setLoading(true);
    setOutput(null);
    // Build a rich, project-specific prompt using ALL available project context
    const context = buildProjectContext(project);
    const basePrompt = selectedType.aiKickstarter
      .replace("{title}", project?.title || "Untitled Project")
      .replace("{description}", project?.description || "No description provided.");
    const prompt = `${basePrompt}

Here is the full project context to inform your advice:
${context}

Use this context to give highly specific, actionable advice tailored to THIS exact project. Reference the actual project name, skills, tools, and goals where relevant. Do not give generic advice.`;
    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setOutput(result);
    } catch (e) {
      toast.error("AI generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Project context preview */}
      {!output && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your project context (used by AI)</p>
          <div className="flex flex-wrap gap-1.5">
            {project?.title && <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">📌 {project.title}</span>}
            {project?.classification && <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">{project.classification}</span>}
            {project?.industry && <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">{project.industry}</span>}
            {project?.skills_needed?.slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 bg-purple-50 border border-purple-100 rounded text-xs text-purple-600">{s}</span>)}
            {project?.tools_needed?.slice(0, 3).map(t => <span key={t} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-600">{t}</span>)}
          </div>
        </div>
      )}

      {!output && !loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Generate your personalized build plan</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              AI will analyze your project's description, skills, tools, and goals to create a plan specific to <strong>{project?.title || "your project"}</strong>.
            </p>
          </div>
          <Button onClick={run} className="cu-button gap-2" size="sm">
            <Sparkles className="w-3.5 h-3.5" /> Generate My Plan
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-purple-600">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <p className="text-sm font-medium">Analyzing your project and crafting a tailored plan...</p>
        </div>
      )}

      {output && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
              {output}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={run} variant="ghost" size="sm" className="text-xs gap-1 text-gray-400 hover:text-purple-600">
              <RefreshCw className="w-3 h-3" /> Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main BuildTab ─────────────────────────────────────────────────────────

export default function BuildTab({ project, currentUser, isCollaborator, isProjectOwner }) {
  const canEdit = isCollaborator || isProjectOwner;
  const storageKey = `cu_build_${project?.id}`;

  // Persisted state via ProjectIDE entity + localStorage fallback
  const [selectedType, setSelectedType] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [buildNotes, setBuildNotes] = useState("");
  const [savedLinks, setSavedLinks] = useState([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [ideRecord, setIdeRecord] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [buildMilestones, setBuildMilestones] = useState([]);
  const [stepMilestoneLinks, setStepMilestoneLinks] = useState({});
  const [showSuggestion, setShowSuggestion] = useState(false);
  const suggestedType = detectBuildType(project);

  // Platform launcher state
  const [previewUrl, setPreviewUrl] = useState("");
  const [activePreviewUrl, setActivePreviewUrl] = useState("");
  const [previewBlocked, setPreviewBlocked] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const iframeRef = useRef(null);
  const loadTimerRef = useRef(null);

  const activeType = PROJECT_TYPES.find(t => t.id === selectedType);

  // ── Load persisted data ──
  useEffect(() => {
    if (!project?.id) return;
    const load = async () => {
      try {
        const records = await base44.entities.ProjectIDE.filter({
          project_id: project.id,
          ide_type: "document",
          title: "__build_workspace__"
        });
        if (records && records.length > 0) {
          const rec = records[0];
          setIdeRecord(rec);
          if (rec.content) {
            const parsed = JSON.parse(rec.content);
            if (parsed.selectedType) setSelectedType(parsed.selectedType);
            if (parsed.checkedSteps) setCheckedSteps(parsed.checkedSteps);
            if (parsed.buildNotes) setBuildNotes(parsed.buildNotes);
            if (parsed.savedLinks) setSavedLinks(parsed.savedLinks);
            if (parsed.buildMilestones) setBuildMilestones(parsed.buildMilestones);
            if (parsed.stepMilestoneLinks) setStepMilestoneLinks(parsed.stepMilestoneLinks);
          }
        }
      } catch (e) {
        // Fallback to localStorage
        try {
          const local = localStorage.getItem(storageKey);
          if (local) {
            const parsed = JSON.parse(local);
            if (parsed.selectedType) setSelectedType(parsed.selectedType);
            if (parsed.checkedSteps) setCheckedSteps(parsed.checkedSteps);
            if (parsed.buildNotes) setBuildNotes(parsed.buildNotes);
            if (parsed.savedLinks) setSavedLinks(parsed.savedLinks);
            if (parsed.buildMilestones) setBuildMilestones(parsed.buildMilestones);
            if (parsed.stepMilestoneLinks) setStepMilestoneLinks(parsed.stepMilestoneLinks);
          }
        } catch {}
      }
      setDataLoaded(true);
    };
    load();
    return () => clearTimeout(loadTimerRef.current);
  }, [project?.id]);

  // Show suggestion banner once data is loaded and no type selected yet
  useEffect(() => {
    if (dataLoaded && !selectedType && suggestedType) {
      setShowSuggestion(true);
    }
  }, [dataLoaded, selectedType, suggestedType]);

  // ── Persist data ──
  const persist = useCallback(async (newData) => {
    if (!project?.id || !canEdit) return;
    const payload = { selectedType, checkedSteps, buildNotes, savedLinks, buildMilestones, stepMilestoneLinks, ...newData };
    const content = JSON.stringify(payload);
    // localStorage fallback always
    try { localStorage.setItem(storageKey, content); } catch {}
    // DB persist
    try {
      if (ideRecord) {
        await base44.entities.ProjectIDE.update(ideRecord.id, { content, last_modified_by: currentUser?.email });
      } else {
        const rec = await base44.entities.ProjectIDE.create({
          project_id: project.id,
          ide_type: "document",
          title: "__build_workspace__",
          content,
          last_modified_by: currentUser?.email,
        });
        setIdeRecord(rec);
      }
    } catch {}
  }, [project?.id, ideRecord, selectedType, checkedSteps, buildNotes, savedLinks, canEdit, currentUser]);

  const handleSelectType = (typeId) => {
    const newType = selectedType === typeId ? null : typeId;
    setSelectedType(newType);
    setShowSuggestion(false);
    persist({ selectedType: newType, checkedSteps: {} });
    setCheckedSteps({});
  };

  const handleAcceptSuggestion = () => {
    setSelectedType(suggestedType);
    setShowSuggestion(false);
    persist({ selectedType: suggestedType, checkedSteps: {} });
  };

  const handleMilestonesChange = (updated) => {
    setBuildMilestones(updated);
    persist({ buildMilestones: updated });
  };

  const handleStepMilestoneLinkChange = (updated) => {
    setStepMilestoneLinks(updated);
    persist({ stepMilestoneLinks: updated });
  };

  const handleToggleStep = (key) => {
    if (!canEdit) return;
    const updated = { ...checkedSteps, [key]: !checkedSteps[key] };
    setCheckedSteps(updated);
    persist({ checkedSteps: updated });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await persist({ buildNotes });
    setIsSavingNotes(false);
    toast.success("Build notes saved.");
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    try {
      new URL(linkUrl);
      const updated = [...savedLinks, { url: linkUrl, label: linkLabel || linkUrl }];
      setSavedLinks(updated);
      persist({ savedLinks: updated });
      setLinkUrl(""); setLinkLabel(""); setShowAddLink(false);
    } catch { toast.error("Please enter a valid URL (include https://)"); }
  };

  const handleRemoveLink = (i) => {
    const updated = savedLinks.filter((_, idx) => idx !== i);
    setSavedLinks(updated);
    persist({ savedLinks: updated });
  };

  const handleLaunchPreview = (url) => {
    try {
      const full = new URL(url.startsWith("http") ? url : `https://${url}`).href;
      setActivePreviewUrl(full); setPreviewBlocked(false); setPreviewLoading(true);
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(() => { setPreviewBlocked(true); setPreviewLoading(false); }, 6000);
    } catch { toast.error("Please enter a valid URL."); }
  };

  const totalSteps = activeType ? activeType.phases.reduce((a, p) => a + p.steps.length, 0) : 0;
  const completedSteps = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Build Workspace</h2>
            <p className="text-sm text-gray-500">
              {project?.title ? `Building "${project.title}" — from idea to tangible product.` : "From idea to tangible product — everything you need to build."}
            </p>
          </div>
        </div>
        {activeType && totalSteps > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">Overall Progress</p>
              <p className="text-sm font-bold text-purple-700">{completedSteps}/{totalSteps} steps</p>
            </div>
            <div className="w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#7c3aed" strokeWidth="3"
                  strokeDasharray={`${(completedSteps / totalSteps) * 88} 88`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ── Auto-detected suggestion banner ── */}
      {showSuggestion && suggestedType && (
        <ProjectContextBanner
          project={project}
          suggestedTypeId={suggestedType}
          onAccept={handleAcceptSuggestion}
          onDismiss={() => setShowSuggestion(false)}
        />
      )}

      {/* ── Project Type Selector ── */}
      <Card className="cu-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Layers className="w-4 h-4 mr-2 text-purple-600" />
            What are you building?
          </CardTitle>
          <CardDescription>Select your project type to unlock the full build toolkit and roadmap.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {PROJECT_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left ${
                    isActive ? type.activeColor : `${type.color} hover:opacity-80`
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="font-semibold text-xs leading-tight">{type.label}</span>
                  <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? "text-white/75" : "opacity-60"}`}>{type.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Active Type Content ── */}
      {activeType && (
        <Tabs defaultValue="roadmap" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="roadmap" className="text-xs py-2 gap-1"><Map className="w-3 h-3" />Roadmap</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs py-2 gap-1"><Wrench className="w-3 h-3" />Tools</TabsTrigger>
            <TabsTrigger value="launcher" className="text-xs py-2 gap-1"><Eye className="w-3 h-3" />Launcher</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs py-2 gap-1"><Sparkles className="w-3 h-3" />AI Plan</TabsTrigger>
          </TabsList>

          {/* ── Roadmap Tab ── */}
          <TabsContent value="roadmap" className="mt-0">
            <Card className="cu-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="w-4 h-4 text-purple-600" />
                  Build Roadmap — {activeType.label}
                </CardTitle>
                <CardDescription>Step-by-step phases from zero to a finished product. Check off steps as you complete them.</CardDescription>
              </CardHeader>
              <CardContent>
                <BuildRoadmap
                  phases={activeType.phases}
                  checkedSteps={checkedSteps}
                  onToggleStep={handleToggleStep}
                  buildMilestones={buildMilestones}
                  onMilestonesChange={handleMilestonesChange}
                  stepMilestoneLinks={stepMilestoneLinks}
                  onStepMilestoneLinkChange={handleStepMilestoneLinkChange}
                  canEdit={canEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tools Tab ── */}
          <TabsContent value="tools" className="mt-0 space-y-4">
            <ProjectSkillsTools project={project} />
            {activeType.toolCategories.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <Card key={cat.label} className="cu-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CatIcon className="w-4 h-4 text-purple-600" />
                      {cat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cat.tools.map((tool) => (
                        <a
                          key={tool.name}
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg transition-all group"
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${new URL(tool.url).hostname}&sz=32`}
                            alt={tool.name}
                            className="w-5 h-5 flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 group-hover:text-purple-700 truncate">{tool.name}</p>
                            <p className="text-xs text-gray-400 truncate">{tool.desc}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-500 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ── Launcher Tab ── */}
          <TabsContent value="launcher" className="mt-0">
            <Card className="cu-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  Platform Launcher
                </CardTitle>
                <CardDescription>Open any web-based tool in an embedded view. Sign in within the preview to start building.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLaunchPreview(previewUrl)}
                      placeholder="Paste any URL (e.g. codesandbox.io)"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                  <Button onClick={() => handleLaunchPreview(previewUrl)} disabled={!previewUrl.trim()} className="cu-button flex-shrink-0" size="sm">
                    Launch <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                  {activePreviewUrl && (
                    <Button variant="ghost" size="sm" onClick={() => { setActivePreviewUrl(""); setPreviewBlocked(false); }} className="flex-shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {!activePreviewUrl && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Embed-friendly platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {EMBEDDABLE_PLATFORMS.map((p) => (
                        <button key={p.name} onClick={() => { setPreviewUrl(p.url); handleLaunchPreview(p.url); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-full text-sm text-gray-700 hover:text-purple-700 transition-all">
                          <img src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=16`} alt="" className="w-4 h-4" onError={(e) => { e.target.style.display = 'none'; }} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activePreviewUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
                      <div className="flex gap-1"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="w-3 h-3 rounded-full bg-green-400" /></div>
                      <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-500 truncate border border-gray-200">{activePreviewUrl}</div>
                      <button onClick={() => handleLaunchPreview(activePreviewUrl)} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-3.5 h-3.5" /></button>
                      <a href={activePreviewUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-600"><ExternalLink className="w-3.5 h-3.5" /></a>
                    </div>
                    {previewLoading && (
                      <div className="absolute inset-0 top-9 bg-white/80 flex items-center justify-center z-10">
                        <div className="text-center"><RefreshCw className="w-6 h-6 text-purple-500 animate-spin mx-auto mb-2" /><p className="text-sm text-gray-500">Loading...</p></div>
                      </div>
                    )}
                    {previewBlocked && (
                      <div className="absolute inset-0 top-9 bg-white flex flex-col items-center justify-center z-10 p-6 text-center">
                        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                        <h3 className="font-semibold text-gray-800 mb-1">This site blocks embedding</h3>
                        <p className="text-sm text-gray-500 mb-4 max-w-sm">Open it in a new tab to work on it, then paste your work-in-progress link in Team Links below.</p>
                        <a href={activePreviewUrl} target="_blank" rel="noopener noreferrer" className="cu-button flex items-center gap-2 px-4 py-2 text-sm rounded-lg">
                          Open in new tab <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <iframe ref={iframeRef} key={activePreviewUrl} src={activePreviewUrl} title="Platform Preview" className="w-full border-0"
                      style={{ height: '560px' }} onLoad={() => { clearTimeout(loadTimerRef.current); setPreviewLoading(false); setPreviewBlocked(false); }}
                      allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write" allowFullScreen />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── AI Plan Tab ── */}
          <TabsContent value="ai" className="mt-0">
            <Card className="cu-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI Build Kickstarter
                </CardTitle>
                <CardDescription>Get a personalized plan tailored to your specific project and build type.</CardDescription>
              </CardHeader>
              <CardContent>
                <AIKickstarter project={project} selectedType={activeType} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Team Build Links (always visible) ── */}
      <Card className="cu-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-purple-600" />
              Team Build Links
            </CardTitle>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setShowAddLink(!showAddLink)} className="text-purple-600 hover:bg-purple-50 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Link
              </Button>
            )}
          </div>
          <CardDescription>Share repos, staging environments, design files, docs, or any build resource with the team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddLink && canEdit && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
              <Input placeholder="Label (e.g. GitHub Repo, Figma File, Staging)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="text-sm" />
              <div className="flex gap-2">
                <Input type="url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddLink()} className="text-sm" />
                <Button onClick={handleAddLink} size="sm" className="cu-button flex-shrink-0">Add</Button>
              </div>
            </div>
          )}
          {savedLinks.length === 0 && !showAddLink && (
            <div className="text-center py-6 text-gray-400">
              <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No build links yet. Add repos, design files, or staging links.</p>
            </div>
          )}
          {savedLinks.map((link, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group">
              <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} alt="" className="w-4 h-4 flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:text-purple-700">
                <p className="font-medium text-sm text-gray-900 truncate">{link.label}</p>
                <p className="text-xs text-gray-400 truncate">{link.url}</p>
              </a>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-purple-500"><ExternalLink className="w-3.5 h-3.5" /></a>
              {canEdit && (
                <button onClick={() => handleRemoveLink(i)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Build Notes (always visible, persisted) ── */}
      <Card className="cu-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="w-4 h-4 text-purple-600" />
            Build Notes
          </CardTitle>
          <CardDescription>Shared notes for the team — architecture decisions, blockers, conventions, or anything important.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g. Tech stack: Next.js + Supabase. Branch naming: feature/your-name-feature. Don't merge to main without review. Current blocker: waiting on API keys from @alex..."
            value={buildNotes}
            onChange={(e) => setBuildNotes(e.target.value)}
            rows={6}
            disabled={!canEdit}
            className="text-sm resize-none"
          />
          {canEdit && (
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes} disabled={isSavingNotes} size="sm" className="cu-button">
                {isSavingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}