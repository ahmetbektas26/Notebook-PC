export type Page =
  | "today"
  | "calendar"
  | "review"
  | "goals"
  | "notes"
  | "templates"
  | "school"
  | "settings";
export type RepeatMode = "none" | "daily" | "weekly";
export type Theme = "light" | "dark";
export type PlannerKind = "task" | "plan" | "note" | "goal";
export type GoalCategory =
  | "personal"
  | "health"
  | "career"
  | "finance"
  | "learning";

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  createdAt: string;
}

export interface AudioNote {
  id: string;
  fileName: string;
  duration: number;
  createdAt: string;
}

export interface PdfAttachment {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  createdAt: string;
  annotations: PdfAnnotation[];
}

export interface PdfAnnotation {
  id: string;
  type: "underline" | "note";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  courseId: string | null;
  topic: string;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  audio: AudioNote[];
  attachments: PdfAttachment[];
}

export interface PlannerItem {
  id: string;
  title: string;
  details: string;
  date: string;
  time: string;
  kind: PlannerKind;
  reminder: boolean;
  repeat: RepeatMode;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  progress: number;
  deadline: string;
  createdAt: string;
}

export interface GradeEntry {
  id: string;
  course: string;
  ects: number;
  letter: GradeLetter;
}

export type GradeLetter =
  | "A+"
  | "A"
  | "B+"
  | "B"
  | "C+"
  | "C"
  | "D+"
  | "D"
  | "F";

export interface AppSettings {
  theme: Theme;
  currentCredits: number;
  currentGpa: number;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  scope: "personal" | "school";
  topic: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface FocusSession {
  id: string;
  minutes: number;
  completedAt: string;
}

export interface WeeklyReflection {
  weekStart: string;
  wins: string;
  lessons: string;
  nextWeek: string;
  updatedAt: string;
}

export interface AppData {
  version: 4;
  courses: Course[];
  notes: Note[];
  plannerItems: PlannerItem[];
  goals: Goal[];
  grades: GradeEntry[];
  templates: NoteTemplate[];
  focusSessions: FocusSession[];
  weeklyReflections: WeeklyReflection[];
  settings: AppSettings;
}

export interface SecurityStatus {
  enabled: boolean;
  locked: boolean;
  autoLockMinutes: number;
}

export interface ReminderForSystem {
  id: string;
  title: string;
  dueAt: string;
  repeat: RepeatMode;
  completed: boolean;
  courseName?: string;
}
