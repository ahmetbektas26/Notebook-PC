function nextOccurrence(reminder, now = Date.now()) {
  const initial = new Date(reminder.dueAt);
  if (Number.isNaN(initial.getTime())) return null;
  if (initial.getTime() > now) return initial;
  if (reminder.repeat === "none") return null;

  const next = new Date(initial);
  const step = reminder.repeat === "daily" ? 1 : 7;
  while (next.getTime() <= now) next.setDate(next.getDate() + step);
  return next;
}

module.exports = { nextOccurrence };
