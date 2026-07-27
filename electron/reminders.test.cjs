const assert = require("node:assert/strict");
const test = require("node:test");
const { nextOccurrence } = require("./reminders.cjs");

const now = new Date("2026-07-27T10:00:00Z").getTime();

test("gelecekteki tek seferlik alarmı olduğu gibi korur", () => {
  const next = nextOccurrence(
    { dueAt: "2026-07-27T11:30:00Z", repeat: "none" },
    now
  );
  assert.equal(next.toISOString(), "2026-07-27T11:30:00.000Z");
});

test("geçmiş tek seferlik alarmı yeniden kurmaz", () => {
  assert.equal(
    nextOccurrence(
      { dueAt: "2026-07-27T09:30:00Z", repeat: "none" },
      now
    ),
    null
  );
});

test("günlük ve haftalık alarmı ilk gelecek tarihe taşır", () => {
  const daily = nextOccurrence(
    { dueAt: "2026-07-25T11:00:00Z", repeat: "daily" },
    now
  );
  const weekly = nextOccurrence(
    { dueAt: "2026-07-20T11:00:00Z", repeat: "weekly" },
    now
  );
  assert.equal(daily.toISOString(), "2026-07-27T11:00:00.000Z");
  assert.equal(weekly.toISOString(), "2026-07-27T11:00:00.000Z");
});

test("geçersiz tarih alarm kurmaz", () => {
  assert.equal(
    nextOccurrence({ dueAt: "geçersiz", repeat: "daily" }, now),
    null
  );
});
