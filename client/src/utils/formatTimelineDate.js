const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// "Today · 3:42 PM" / "Yesterday · 7:15 PM" / "Sep 3 · 8:02 PM" (falls back to
// including the year once it's not the current one) -- used to give each
// community feed entry a timeline-style stamp.
export function formatTimelineDate(isoString) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

  if (dayDiff === 0) {
    return `Today · ${time}`;
  }
  if (dayDiff === 1) {
    return `Yesterday · ${time}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });

  return `${day} · ${time}`;
}
