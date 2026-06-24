/**
 * Returns the base URL for share links.
 * Uses the custom domain (collabunity.io) when running on a base44.app preview/sandbox URL,
 * otherwise falls back to the current window origin (which will be the custom domain in production).
 */
export const CUSTOM_DOMAIN = "https://collabunity.io";

export function getShareBaseUrl() {
  const hostname = window.location.hostname;
  // If we're on a base44.app domain (preview/sandbox), use the custom domain for share links
  if (hostname.includes("base44.app") || hostname.includes("base44.com")) {
    return CUSTOM_DOMAIN;
  }
  return window.location.origin;
}

/**
 * Builds a full share URL from a page path (e.g. "UserProfile?username=john").
 */
export function buildShareUrl(pagePath) {
  return `${getShareBaseUrl()}/${pagePath}`;
}