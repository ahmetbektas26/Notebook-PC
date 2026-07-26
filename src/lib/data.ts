import type {
  AppData,
  GradeEntry,
  Note,
  PdfAttachment,
  PlannerItem,
  RepeatMode,
  Theme
} from "../types";

export const COURSE_COLORS = [
  "#e07a5f",
  "#3d8d7a",
  "#5576b9",
  "#9b6bb3",
  "#d39b36",
  "#457b9d"
];

export function uid() {
  return crypto.randomUUID();
}

export function createInitialData(): AppData {
  return {
    version: 3,
    courses: [],
    notes: [],
    plannerItems: [],
    goals: [],
    grades: [],
    settings: {
      theme: "light",
      currentCredits: 0,
      currentGpa: 0
    }
  };
}

export function isValidAppData(data: unknown): data is AppData {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<AppData>;
  return (
    candidate.version === 3 &&
    Array.isArray(candidate.courses) &&
    Array.isArray(candidate.notes) &&
    Array.isArray(candidate.plannerItems) &&
    Array.isArray(candidate.goals) &&
    Array.isArray(candidate.grades) &&
    typeof candidate.settings === "object"
  );
}

interface LegacyReminder {
  id: string;
  title: string;
  dueAt: string;
  repeat: RepeatMode;
  completed: boolean;
  createdAt: string;
}

type LegacyNote = Omit<Note, "attachments"> & {
  attachments?: PdfAttachment[];
};

interface LegacyData {
  version: 1;
  courses?: AppData["courses"];
  notes?: LegacyNote[];
  reminders?: LegacyReminder[];
  grades?: GradeEntry[];
  settings?: {
    theme?: Theme;
    currentCredits?: number;
    currentGpa?: number;
  };
}

interface VersionTwoData {
  version: 2;
  courses?: AppData["courses"];
  notes?: LegacyNote[];
  plannerItems?: AppData["plannerItems"];
  goals?: AppData["goals"];
  grades?: AppData["grades"];
  settings?: AppData["settings"];
}

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function migrateAppData(data: unknown): AppData | null {
  if (isValidAppData(data)) return data;
  if (!data || typeof data !== "object") return null;
  const versionTwo = data as VersionTwoData;
  if (versionTwo.version === 2) {
    return {
      version: 3,
      courses: Array.isArray(versionTwo.courses) ? versionTwo.courses : [],
      notes: Array.isArray(versionTwo.notes)
        ? versionTwo.notes.map((note) => ({
            ...note,
            courseId: note.courseId ?? null,
            attachments: Array.isArray(note.attachments)
              ? note.attachments
              : []
          }))
        : [],
      plannerItems: Array.isArray(versionTwo.plannerItems)
        ? versionTwo.plannerItems
        : [],
      goals: Array.isArray(versionTwo.goals) ? versionTwo.goals : [],
      grades: Array.isArray(versionTwo.grades) ? versionTwo.grades : [],
      settings: versionTwo.settings ?? {
        theme: "light",
        currentCredits: 0,
        currentGpa: 0
      }
    };
  }
  const legacy = data as LegacyData;
  if (legacy.version !== 1) return null;

  const courses = Array.isArray(legacy.courses) ? legacy.courses : [];
  const notes = Array.isArray(legacy.notes) ? legacy.notes : [];
  const reminders = Array.isArray(legacy.reminders) ? legacy.reminders : [];
  const grades = Array.isArray(legacy.grades) ? legacy.grades : [];
  const hasOnlyOldDemo =
    courses.length === 1 &&
    courses[0]?.name === "Data Structures" &&
    courses[0]?.code === "COME 218" &&
    notes.length === 1 &&
    notes[0]?.title === "Notebook-PC'ye hoş geldin" &&
    reminders.length === 0 &&
    grades.length === 0;

  if (hasOnlyOldDemo) {
    const fresh = createInitialData();
    fresh.settings.theme = legacy.settings?.theme ?? "light";
    return fresh;
  }

  const notesWithoutDemo = notes.filter(
    (note) =>
      !(
        note.title === "Notebook-PC'ye hoş geldin" &&
        note.topic === "Başlangıç"
      )
  );
  const demoCourse = courses.find(
    (course) =>
      course.name === "Data Structures" && course.code === "COME 218"
  );
  const cleanedCourses =
    demoCourse &&
    !notesWithoutDemo.some((note) => note.courseId === demoCourse.id)
      ? courses.filter((course) => course.id !== demoCourse.id)
      : courses;

  const plannerItems: PlannerItem[] = reminders.map((reminder) => {
    const due = new Date(reminder.dueAt);
    const hours = `${due.getHours()}`.padStart(2, "0");
    const minutes = `${due.getMinutes()}`.padStart(2, "0");
    return {
      id: reminder.id,
      title: reminder.title,
      details: "",
      date: localDateKey(due),
      time: `${hours}:${minutes}`,
      kind: "task",
      reminder: true,
      repeat: reminder.repeat,
      completed: reminder.completed,
      createdAt: reminder.createdAt
    };
  });
  const wasOldPersonalDefault =
    legacy.settings?.currentCredits === 183 &&
    legacy.settings?.currentGpa === 2.43;

  return {
    version: 3,
    courses: cleanedCourses,
    notes: notesWithoutDemo.map((note) => ({
      ...note,
      courseId: note.courseId ?? null,
      attachments: Array.isArray(note.attachments) ? note.attachments : []
    })),
    plannerItems,
    goals: [],
    grades,
    settings: {
      theme: legacy.settings?.theme ?? "light",
      currentCredits: wasOldPersonalDefault
        ? 0
        : legacy.settings?.currentCredits ?? 0,
      currentGpa: wasOldPersonalDefault
        ? 0
        : legacy.settings?.currentGpa ?? 0
    }
  };
}

export async function loadAppData(): Promise<AppData> {
  if (window.notebookAPI) {
    const stored = await window.notebookAPI.loadData();
    return migrateAppData(stored) ?? createInitialData();
  }
  const stored = localStorage.getItem("notebook-pc-data");
  if (!stored) return createInitialData();
  try {
    return migrateAppData(JSON.parse(stored)) ?? createInitialData();
  } catch {
    return createInitialData();
  }
}

export async function persistAppData(data: AppData) {
  if (window.notebookAPI) {
    await window.notebookAPI.saveData(data);
    return;
  }
  localStorage.setItem("notebook-pc-data", JSON.stringify(data));
}
