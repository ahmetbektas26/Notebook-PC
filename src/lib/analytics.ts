import type { AppData } from "../types";
import { localDateKey } from "./data";

export function startOfWeek(date = new Date()) {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return value;
}

export function weekDateKeys(date = new Date()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return localDateKey(day);
  });
}

export function weeklyStats(data: AppData, date = new Date()) {
  const keys = weekDateKeys(date);
  const startMs = new Date(`${keys[0]}T00:00:00`).getTime();
  const endMs = new Date(`${keys[6]}T23:59:59`).getTime();
  const items = data.plannerItems.filter((item) => keys.includes(item.date));
  const completed = items.filter((item) => item.completed);
  const notesEdited = data.notes.filter((note) => {
    const time = new Date(note.updatedAt).getTime();
    return time >= startMs && time <= endMs;
  });
  const focusMinutes = data.focusSessions
    .filter((session) => {
      const time = new Date(session.completedAt).getTime();
      return time >= startMs && time <= endMs;
    })
    .reduce((sum, session) => sum + session.minutes, 0);
  const days = keys.map((key) => {
    const dayItems = items.filter((item) => item.date === key);
    const dayCompleted = dayItems.filter((item) => item.completed).length;
    return {
      key,
      total: dayItems.length,
      completed: dayCompleted,
      percentage: dayItems.length
        ? Math.round((dayCompleted / dayItems.length) * 100)
        : 0
    };
  });

  return {
    weekStart: keys[0],
    weekEnd: keys[6],
    planned: items.length,
    completed: completed.length,
    completionRate: items.length
      ? Math.round((completed.length / items.length) * 100)
      : 0,
    notesEdited: notesEdited.length,
    focusMinutes,
    completedGoals: data.goals.filter((goal) => goal.progress === 100).length,
    activeGoals: data.goals.filter((goal) => goal.progress < 100).length,
    days
  };
}
