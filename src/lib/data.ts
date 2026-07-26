import type { AppData, Course, Note } from "../types";

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
  const now = new Date().toISOString();
  const course: Course = {
    id: uid(),
    name: "Data Structures",
    code: "COME 218",
    color: COURSE_COLORS[0],
    createdAt: now
  };
  const note: Note = {
    id: uid(),
    courseId: course.id,
    topic: "Başlangıç",
    title: "Notebook-PC'ye hoş geldin",
    content:
      "# İlk notun hazır\n\nDerslerini soldaki **+** düğmesiyle ekleyebilir, notlarını konu konu düzenleyebilirsin.\n\n- Yazılı not al\n- Ses kaydı ekle\n- Etiketle ve favorilere al\n- Gün ve saat seçerek alarm kur",
    tags: ["başlangıç"],
    favorite: true,
    createdAt: now,
    updatedAt: now,
    audio: []
  };

  return {
    version: 1,
    courses: [course],
    notes: [note],
    reminders: [],
    grades: [],
    settings: {
      theme: "light",
      currentCredits: 183,
      currentGpa: 2.43
    }
  };
}

export function isValidAppData(data: unknown): data is AppData {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<AppData>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.courses) &&
    Array.isArray(candidate.notes) &&
    Array.isArray(candidate.reminders) &&
    Array.isArray(candidate.grades) &&
    typeof candidate.settings === "object"
  );
}

export async function loadAppData(): Promise<AppData> {
  if (window.notebookAPI) {
    const stored = await window.notebookAPI.loadData();
    return stored && isValidAppData(stored) ? stored : createInitialData();
  }
  const stored = localStorage.getItem("notebook-pc-data");
  if (!stored) return createInitialData();
  try {
    const parsed = JSON.parse(stored);
    return isValidAppData(parsed) ? parsed : createInitialData();
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
