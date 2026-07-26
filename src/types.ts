export type Page = "notes" | "reminders" | "grades" | "settings";
export type RepeatMode = "none" | "daily" | "weekly";
export type Theme = "light" | "dark";

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

export interface Note {
  id: string;
  courseId: string;
  topic: string;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  audio: AudioNote[];
}

export interface Reminder {
  id: string;
  title: string;
  courseId: string | null;
  dueAt: string;
  repeat: RepeatMode;
  completed: boolean;
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

export interface AppData {
  version: 1;
  courses: Course[];
  notes: Note[];
  reminders: Reminder[];
  grades: GradeEntry[];
  settings: AppSettings;
}

export interface ReminderForSystem extends Reminder {
  courseName?: string;
}
