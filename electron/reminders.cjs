function nextOccurrence(reminder, now = Date.now()) {
  const initial = new Date(reminder.dueAt);
  if (Number.isNaN(initial.getTime())) return null;
  if (initial.getTime() >= now) return initial;
  if (reminder.repeat === "none") return null;
  if (!["daily", "weekly"].includes(reminder.repeat)) return null;

  const next = new Date(initial);
  const step = reminder.repeat === "daily" ? 1 : 7;
  const approximateStepMs = step * 24 * 60 * 60 * 1000;
  const jumps = Math.max(
    0,
    Math.floor((now - initial.getTime()) / approximateStepMs)
  );
  next.setDate(initial.getDate() + jumps * step);
  while (next.getTime() <= now) next.setDate(next.getDate() + step);
  return next;
}

module.exports = { nextOccurrence };
