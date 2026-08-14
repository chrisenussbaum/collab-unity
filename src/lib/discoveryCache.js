import { base44 } from "@/api/base44Client";

// Shared cache for the public user discovery profile list.
// The backing function getPublicUserProfilesForDiscovery calls User.list()
// under service role, which is aggressively rate-limited — so we cache the
// result for a while and dedupe concurrent callers. On a rate-limit failure
// we fall back to the last good cache instead of showing an empty state.
const CACHE_KEY = "cu_discovery_profiles";
const TTL = 10 * 60 * 1000; // 10 minutes

let memoryCache = null;
let inflight = null;

function readStorageCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data)) return parsed;
    return null;
  } catch (e) {
    return null;
  }
}

function writeStorageCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    /* ignore quota errors */
  }
}

export async function getDiscoveryProfiles() {
  // Fresh memory cache
  if (memoryCache && Date.now() - memoryCache.fetchedAt < TTL) {
    return memoryCache.data;
  }
  // Fresh storage cache
  const stored = readStorageCache();
  if (stored && Date.now() - stored.fetchedAt < TTL) {
    memoryCache = stored;
    return stored.data;
  }

  // Dedupe concurrent callers so we only fire one request
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await base44.functions.invoke("getPublicUserProfilesForDiscovery");
      const data = Array.isArray(res?.data) ? res.data : [];
      const entry = { data, fetchedAt: Date.now() };
      memoryCache = entry;
      writeStorageCache(entry);
      return data;
    } catch (e) {
      // Rate-limited or failed — fall back to stale cache so the UI keeps data
      if (memoryCache) return memoryCache.data;
      if (stored) {
        memoryCache = stored;
        return stored.data;
      }
      throw e;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}