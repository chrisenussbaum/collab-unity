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

/**
 * Builds a social share URL that points to the getSharePreview backend function.
 * This returns an HTML page with dynamic Open Graph meta tags (project logo,
 * profile image, title) so social platforms show a rich preview instead of the
 * default landing page screenshot.
 *
 * Real users are redirected to the actual app page via JavaScript.
 *
 * @param {string} type - "project" or "profile"
 * @param {object} params - { id } for projects, { username } for profiles
 */
export function buildSocialShareUrl(type, params = {}) {
  const base = getShareBaseUrl();
  const query = new URLSearchParams({ type });
  if (type === 'project' && params.id) {
    query.set('id', params.id);
  } else if (type === 'profile' && params.username) {
    query.set('username', params.username);
  }
  return `${base}/functions/getSharePreview?${query.toString()}`;
}