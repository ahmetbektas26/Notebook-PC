import type {
  AppData,
  AudioNote,
  Course,
  FocusSession,
  Goal,
  GoalCategory,
  GradeEntry,
  GradeLetter,
  Note,
  NoteTemplate,
  PdfAnnotation,
  PdfAttachment,
  PlannerItem,
  PlannerKind,
  RepeatMode,
  Theme,
  WeeklyReflection
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
    version: 4,
    courses: [],
    notes: [],
    plannerItems: [],
    goals: [],
    grades: [],
    templates: [],
    focusSessions: [],
    weeklyReflections: [],
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
    candidate.version === 4 &&
    Array.isArray(candidate.courses) &&
    Array.isArray(candidate.notes) &&
    Array.isArray(candidate.plannerItems) &&
    Array.isArray(candidate.goals) &&
    Array.isArray(candidate.grades) &&
    Array.isArray(candidate.templates) &&
    Array.isArray(candidate.focusSessions) &&
    Array.isArray(candidate.weeklyReflections) &&
    Boolean(candidate.settings) &&
    typeof candidate.settings === "object" &&
    ["light", "dark"].includes(candidate.settings.theme) &&
    Number.isFinite(candidate.settings.currentCredits) &&
    Number.isFinite(candidate.settings.currentGpa)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown) {
  return value === true;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
) {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function validDate(value: unknown, fallback: string) {
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime()))
    return fallback;
  return value;
}

function validDateKey(value: unknown, fallback = "") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return fallback;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

function validTime(value: unknown) {
  if (typeof value !== "string") return "";
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}

function clamp(value: unknown, minimum: number, maximum: number, fallback: number) {
  return Math.min(maximum, Math.max(minimum, numberValue(value, fallback)));
}

function uniqueId(
  value: unknown,
  prefix: string,
  index: number,
  used: Set<string>
) {
  const base = stringValue(value).trim() || `${prefix}-${index + 1}`;
  let next = base;
  let suffix = 2;
  while (used.has(next)) {
    next = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(next);
  return next;
}

function normalizeVersionFour(raw: Record<string, unknown>): AppData {
  const now = new Date().toISOString();
  const courseIds = new Set<string>();
  const originalCourseIds = new Map<string, string>();
  const courses: Course[] = (Array.isArray(raw.courses) ? raw.courses : [])
    .filter(isRecord)
    .map((course, index) => {
      const originalId = stringValue(course.id).trim();
      const id = uniqueId(originalId, "course", index, courseIds);
      if (originalId && !originalCourseIds.has(originalId))
        originalCourseIds.set(originalId, id);
      const color = stringValue(course.color);
      return {
        id,
        name: stringValue(course.name).trim() || "Adsız ders",
        code: stringValue(course.code).trim(),
        color: /^#[0-9a-f]{6}$/i.test(color)
          ? color
          : COURSE_COLORS[index % COURSE_COLORS.length],
        createdAt: validDate(course.createdAt, now)
      };
    });

  const noteIds = new Set<string>();
  const notes: Note[] = (Array.isArray(raw.notes) ? raw.notes : [])
    .filter(isRecord)
    .map((note, noteIndex) => {
      const audioIds = new Set<string>();
      const audio: AudioNote[] = (
        Array.isArray(note.audio) ? note.audio : []
      )
        .filter(isRecord)
        .map((recording, index) => ({
          id: uniqueId(recording.id, `audio-${noteIndex + 1}`, index, audioIds),
          fileName: stringValue(recording.fileName),
          duration: clamp(recording.duration, 0, 24 * 60 * 60, 0),
          createdAt: validDate(recording.createdAt, now)
        }))
        .filter((recording) => Boolean(recording.fileName));

      const attachmentIds = new Set<string>();
      const attachments: PdfAttachment[] = (
        Array.isArray(note.attachments) ? note.attachments : []
      )
        .filter(isRecord)
        .map((attachment, attachmentIndex) => {
          const annotationIds = new Set<string>();
          const annotations: PdfAnnotation[] = (
            Array.isArray(attachment.annotations)
              ? attachment.annotations
              : []
          )
            .filter(isRecord)
            .map((annotation, index) => ({
              id: uniqueId(
                annotation.id,
                `annotation-${noteIndex + 1}-${attachmentIndex + 1}`,
                index,
                annotationIds
              ),
              type: enumValue(
                annotation.type,
                ["underline", "note"] as const,
                "note"
              ),
              page: Math.round(clamp(annotation.page, 1, 100_000, 1)),
              x: clamp(annotation.x, 0, 1, 0),
              y: clamp(annotation.y, 0, 1, 0),
              width: clamp(annotation.width, 0, 1, 0),
              height: clamp(annotation.height, 0, 1, 0),
              text: stringValue(annotation.text),
              color: /^#[0-9a-f]{6}$/i.test(stringValue(annotation.color))
                ? stringValue(annotation.color)
                : "#e3a72f",
              createdAt: validDate(annotation.createdAt, now)
            }));
          return {
            id: uniqueId(
              attachment.id,
              `attachment-${noteIndex + 1}`,
              attachmentIndex,
              attachmentIds
            ),
            fileName: stringValue(attachment.fileName),
            originalName:
              stringValue(attachment.originalName).trim() || "Belge.pdf",
            size: clamp(attachment.size, 0, 50 * 1024 * 1024, 0),
            createdAt: validDate(attachment.createdAt, now),
            annotations
          };
        })
        .filter((attachment) => Boolean(attachment.fileName));

      const rawCourseId =
        typeof note.courseId === "string" ? note.courseId : null;
      return {
        id: uniqueId(note.id, "note", noteIndex, noteIds),
        courseId: rawCourseId
          ? originalCourseIds.get(rawCourseId) ?? null
          : null,
        topic: stringValue(note.topic).trim() || "Genel",
        title: stringValue(note.title),
        content: stringValue(note.content),
        tags: Array.isArray(note.tags)
          ? note.tags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        favorite: booleanValue(note.favorite),
        createdAt: validDate(note.createdAt, now),
        updatedAt: validDate(note.updatedAt, now),
        audio,
        attachments
      };
    });

  const plannerIds = new Set<string>();
  const plannerItems: PlannerItem[] = (
    Array.isArray(raw.plannerItems) ? raw.plannerItems : []
  )
    .filter(isRecord)
    .map((item, index) => {
      const time = validTime(item.time);
      const reminder = booleanValue(item.reminder) && Boolean(time);
      const completed = booleanValue(item.completed);
      return {
        id: uniqueId(item.id, "planner", index, plannerIds),
        title: stringValue(item.title).trim() || "Adsız kayıt",
        details: stringValue(item.details),
        date: validDateKey(item.date, localDateKey(new Date())),
        time,
        kind: enumValue(
          item.kind,
          ["task", "plan", "note", "goal"] as const,
          "task"
        ) as PlannerKind,
        reminder,
        repeat: reminder
          ? enumValue(
              item.repeat,
              ["none", "daily", "weekly"] as const,
              "none"
            )
          : "none",
        completed,
        ...(completed
          ? { completedAt: validDate(item.completedAt, now) }
          : {}),
        createdAt: validDate(item.createdAt, now)
      };
    });

  const goalIds = new Set<string>();
  const goals: Goal[] = (Array.isArray(raw.goals) ? raw.goals : [])
    .filter(isRecord)
    .map((goal, index) => ({
      id: uniqueId(goal.id, "goal", index, goalIds),
      title: stringValue(goal.title).trim() || "Adsız hedef",
      description: stringValue(goal.description),
      category: enumValue(
        goal.category,
        ["personal", "health", "career", "finance", "learning"] as const,
        "personal"
      ) as GoalCategory,
      progress: clamp(goal.progress, 0, 100, 0),
      deadline: validDateKey(goal.deadline),
      createdAt: validDate(goal.createdAt, now)
    }));

  const gradeIds = new Set<string>();
  const grades: GradeEntry[] = (Array.isArray(raw.grades) ? raw.grades : [])
    .filter(isRecord)
    .map((grade, index) => ({
      id: uniqueId(grade.id, "grade", index, gradeIds),
      course: stringValue(grade.course).trim() || "Adsız ders",
      ects: clamp(grade.ects, 1, 30, 1),
      letter: enumValue(
        grade.letter,
        ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"] as const,
        "F"
      ) as GradeLetter
    }));

  const templateIds = new Set<string>([
    "blank",
    "daily-journal",
    "meeting",
    "project",
    "cornell",
    "exam",
    "weekly-plan"
  ]);
  const templates: NoteTemplate[] = (
    Array.isArray(raw.templates) ? raw.templates : []
  )
    .filter(isRecord)
    .map((template, index) => ({
      id: uniqueId(template.id, "template", index, templateIds),
      name: stringValue(template.name).trim() || "Adsız şablon",
      description: stringValue(template.description),
      scope: enumValue(
        template.scope,
        ["personal", "school"] as const,
        "personal"
      ),
      topic: stringValue(template.topic).trim() || "Genel",
      title: stringValue(template.title).trim() || "Başlıksız not",
      content: stringValue(template.content),
      tags: Array.isArray(template.tags)
        ? template.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      createdAt: validDate(template.createdAt, now)
    }));

  const focusIds = new Set<string>();
  const focusSessions: FocusSession[] = (
    Array.isArray(raw.focusSessions) ? raw.focusSessions : []
  )
    .filter(isRecord)
    .map((session, index) => ({
      id: uniqueId(session.id, "focus", index, focusIds),
      minutes: clamp(session.minutes, 1, 24 * 60, 25),
      completedAt: validDate(session.completedAt, now)
    }));

  const reflectionWeeks = new Set<string>();
  const weeklyReflections: WeeklyReflection[] = (
    Array.isArray(raw.weeklyReflections) ? raw.weeklyReflections : []
  )
    .filter(isRecord)
    .flatMap((reflection) => {
      const weekStart = validDateKey(reflection.weekStart);
      if (!weekStart || reflectionWeeks.has(weekStart)) return [];
      reflectionWeeks.add(weekStart);
      return [
        {
          weekStart,
          wins: stringValue(reflection.wins),
          lessons: stringValue(reflection.lessons),
          nextWeek: stringValue(reflection.nextWeek),
          updatedAt: validDate(reflection.updatedAt, now)
        }
      ];
    });

  const settings = isRecord(raw.settings) ? raw.settings : {};
  return {
    version: 4,
    courses,
    notes,
    plannerItems,
    goals,
    grades,
    templates,
    focusSessions,
    weeklyReflections,
    settings: {
      theme: enumValue(settings.theme, ["light", "dark"] as const, "light"),
      currentCredits: clamp(settings.currentCredits, 0, 1000, 0),
      currentGpa: clamp(settings.currentGpa, 0, 4, 0)
    }
  };
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

interface VersionThreeData {
  version: 3;
  courses?: AppData["courses"];
  notes?: Array<
    Omit<Note, "attachments"> & {
      attachments?: Array<
        Omit<PdfAttachment, "annotations"> & {
          annotations?: PdfAttachment["annotations"];
        }
      >;
    }
  >;
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
  if (!data || typeof data !== "object") return null;
  const current = data as Record<string, unknown>;
  if (current.version === 4) return normalizeVersionFour(current);
  const versionThree = data as VersionThreeData;
  if (versionThree.version === 3) {
    return normalizeVersionFour({
      version: 4,
      courses: Array.isArray(versionThree.courses) ? versionThree.courses : [],
      notes: Array.isArray(versionThree.notes)
        ? versionThree.notes.map((note) => ({
            ...note,
            courseId: note.courseId ?? null,
            attachments: Array.isArray(note.attachments)
              ? note.attachments.map((attachment) => ({
                  ...attachment,
                  annotations: Array.isArray(attachment.annotations)
                    ? attachment.annotations
                    : []
                }))
              : []
          }))
        : [],
      plannerItems: Array.isArray(versionThree.plannerItems)
        ? versionThree.plannerItems
        : [],
      goals: Array.isArray(versionThree.goals) ? versionThree.goals : [],
      grades: Array.isArray(versionThree.grades) ? versionThree.grades : [],
      templates: [],
      focusSessions: [],
      weeklyReflections: [],
      settings: versionThree.settings ?? {
        theme: "light",
        currentCredits: 0,
        currentGpa: 0
      }
    });
  }
  const versionTwo = data as VersionTwoData;
  if (versionTwo.version === 2) {
    return normalizeVersionFour({
      version: 4,
      courses: Array.isArray(versionTwo.courses) ? versionTwo.courses : [],
      notes: Array.isArray(versionTwo.notes)
        ? versionTwo.notes.map((note) => ({
            ...note,
            courseId: note.courseId ?? null,
            attachments: Array.isArray(note.attachments)
              ? note.attachments.map((attachment) => ({
                  ...attachment,
                  annotations: []
                }))
              : []
          }))
        : [],
      plannerItems: Array.isArray(versionTwo.plannerItems)
        ? versionTwo.plannerItems
        : [],
      goals: Array.isArray(versionTwo.goals) ? versionTwo.goals : [],
      grades: Array.isArray(versionTwo.grades) ? versionTwo.grades : [],
      templates: [],
      focusSessions: [],
      weeklyReflections: [],
      settings: versionTwo.settings ?? {
        theme: "light",
        currentCredits: 0,
        currentGpa: 0
      }
    });
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

  return normalizeVersionFour({
    version: 4,
    courses: cleanedCourses,
    notes: notesWithoutDemo.map((note) => ({
      ...note,
      courseId: note.courseId ?? null,
      attachments: Array.isArray(note.attachments)
        ? note.attachments.map((attachment) => ({
            ...attachment,
            annotations: []
          }))
        : []
    })),
    plannerItems,
    goals: [],
    grades,
    templates: [],
    focusSessions: [],
    weeklyReflections: [],
    settings: {
      theme: legacy.settings?.theme ?? "light",
      currentCredits: wasOldPersonalDefault
        ? 0
        : legacy.settings?.currentCredits ?? 0,
      currentGpa: wasOldPersonalDefault
        ? 0
        : legacy.settings?.currentGpa ?? 0
    }
  });
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
