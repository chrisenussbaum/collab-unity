// Precise "time ago" formatter.
//
// date-fns formatDistanceToNow rounds to whole hours ("about 7 hours ago"),
// ignoring minutes, which made timestamps feel inaccurate under 24h. This
// helper includes minute precision for sub-day ranges and degrades cleanly
// to days and then a calendar date.

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

export function timeAgo(dateInput) {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!isValidDate(date)) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();

  // Future timestamp or clock skew — treat as just now.
  if (diffMs < 0) return "just now";

  const sec = diffMs / 1000;
  if (sec < 60) return "just now";

  const min = sec / 60;
  if (min < 60) return `${Math.round(min)}m ago`;

  const hr = min / 60;
  if (hr < 24) {
    const hours = Math.floor(hr);
    const mins = Math.round((hr - hours) * 60);
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  }

  const days = hr / 24;
  if (days < 7) {
    const d = Math.floor(days);
    const hours = Math.round((days - d) * 24);
    return hours > 0 ? `${d}d ${hours}h ago` : `${d}d ago`;
  }

  if (days < 30) return `${Math.round(days)}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}