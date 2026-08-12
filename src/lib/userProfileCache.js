import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { getAllPublicUserProfiles } from "@/functions/getAllPublicUserProfiles";

// Shared, cached, coalesced user-profile fetcher.
//
// Why: many components (Feed, Chat, MyProjects, ProjectDetail, activity feeds,
// discovery widgets, ...) call getPublicUserProfiles on the same page. Firing
// them all at once overwhelms the backend (Supabase User lookup via service
// role) -> HTTP 500 "rate limit exceeded" -> profile_image never arrives ->
// avatars fall back to initials.
//
// This module fixes that by:
//   1. Caching every fetched profile in memory (and localStorage) with a TTL,
//      so repeat lookups across components / page navigations are free.
//   2. Coalescing all requests that arrive within a 30ms tick into ONE backend
//      call (request deduplication), so N components asking for profiles fire a
//      single getPublicUserProfiles instead of N.
//   3. Retrying with exponential backoff on rate-limit (429 / 500 "rate limit")
//      so a transient limit during the single batched call still recovers.
//
// Public API:
//   getCachedUserProfiles(emails) -> Promise<{ email: profile }>
//   getCachedUserProfile(email)  -> Promise<profile | null>
//   getCachedAllUserProfiles()   -> Promise<profile[]>  (for dialogs/autocomplete)

const CACHE_TTL = 10 * 60 * 1000;        // in-memory per-profile TTL: 10 min
const LS_KEY = "cu_user_profile_cache_v1";
const LS_TTL = 30 * 60 * 1000;           // localStorage fallback TTL: 30 min
const ALL_TTL = 5 * 60 * 1000;           // "all users" cache TTL: 5 min

const cache = new Map();                 // email -> { profile, expiresAt }
let allCache = null;                      // { data, expiresAt }
let batch = null;                         // coalesced in-flight batch
let allBatch = null;                      // in-flight "all" promise

// Hydrate from localStorage once on module load.
try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (parsed && parsed.savedAt && now - parsed.savedAt < LS_TTL && parsed.entries) {
      Object.entries(parsed.entries).forEach(([email, profile]) => {
        cache.set(email, { profile, expiresAt: now + LS_TTL });
      });
    }
  }
} catch { /* ignore corrupt cache */ }

function persist() {
  try {
    const now = Date.now();
    const entries = {};
    cache.forEach((v, k) => { if (v.expiresAt > now) entries[k] = v.profile; });
    localStorage.setItem(LS_KEY, JSON.stringify({ savedAt: now, entries }));
  } catch { /* storage full / unavailable — ignore */ }
}

const withRetry = async (fn, maxRetries = 5, baseDelay = 2000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
        (error.response?.status === 500 && /rate limit/i.test(error.response?.data?.error || error.message || ""));
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
};

function scheduleBatch() {
  if (batch) return;
  batch = { emails: new Set(), subscribers: [] };
  setTimeout(flushBatch, 30);
}

async function flushBatch() {
  const b = batch;
  batch = null;
  if (!b) return;
  const emails = [...b.emails];
  const fetched = {};
  try {
    const { data } = await withRetry(() => getPublicUserProfiles({ emails }));
    const now = Date.now();
    (data || []).forEach((p) => {
      cache.set(p.email, { profile: p, expiresAt: now + CACHE_TTL });
      fetched[p.email] = p;
    });
    persist();
  } catch { /* rate-limited even after retries — callers fall back to initials */ }

  b.subscribers.forEach(({ missing, resolve }) => {
    const out = {};
    missing.forEach((e) => { if (fetched[e]) out[e] = fetched[e]; });
    resolve(out);
  });
}

// Returns {email: profile} for the requested emails, fetching only missing ones
// and coalescing concurrent requests into a single backend call.
export async function getCachedUserProfiles(emails) {
  const unique = [...new Set((emails || []).filter(Boolean))];
  const now = Date.now();
  const out = {};
  const missing = [];
  unique.forEach((e) => {
    const entry = cache.get(e);
    if (entry && entry.expiresAt > now) out[e] = entry.profile;
    else missing.push(e);
  });
  if (missing.length === 0) return out;

  return new Promise((resolve) => {
    scheduleBatch();
    missing.forEach((e) => batch.emails.add(e));
    batch.subscribers.push({
      missing,
      resolve: (fetched) => { Object.assign(out, fetched); resolve(out); },
    });
  });
}

export async function getCachedUserProfile(email) {
  if (!email) return null;
  const map = await getCachedUserProfiles([email]);
  return map[email] || null;
}

// Cached "all users" list used by new-chat / new-group dialogs and autocomplete.
export async function getCachedAllUserProfiles() {
  const now = Date.now();
  if (allCache && allCache.expiresAt > now) return allCache.data;
  if (allBatch) return allBatch.promise;

  allBatch = { promise: (async () => {
    try {
      const { data } = await withRetry(() => getAllPublicUserProfiles());
      allCache = { data: data || [], expiresAt: now + ALL_TTL };
      // seed the per-email cache too so later targeted lookups are free
      (data || []).forEach((p) => {
        if (!cache.has(p.email)) cache.set(p.email, { profile: p, expiresAt: now + CACHE_TTL });
      });
      persist();
      return allCache.data;
    } catch (e) {
      allCache = null;
      throw e;
    } finally {
      allBatch = null;
    }
  })() };
  return allBatch.promise;
}