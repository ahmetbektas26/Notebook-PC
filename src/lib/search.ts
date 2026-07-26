import type { AppData, Page } from "../types";

export type SearchHitKind =
  | "note"
  | "pdf"
  | "planner"
  | "goal"
  | "course"
  | "grade";

export interface SearchHit {
  id: string;
  parentId?: string;
  kind: SearchHitKind;
  title: string;
  subtitle: string;
  page: Page;
  score: number;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function rank(query: string, title: string, body: string) {
  const normalizedTitle = normalize(title);
  const normalizedBody = normalize(body);
  if (normalizedTitle === query) return 100;
  if (normalizedTitle.startsWith(query)) return 80;
  if (normalizedTitle.includes(query)) return 60;
  if (normalizedBody.includes(query)) return 35;
  return 0;
}

export function searchAppData(data: AppData, rawQuery: string): SearchHit[] {
  const query = normalize(rawQuery.trim());
  if (query.length < 2) return [];
  const hits: SearchHit[] = [];

  data.notes.forEach((note) => {
    const course = data.courses.find((item) => item.id === note.courseId);
    const score = rank(
      query,
      note.title,
      [note.topic, note.content, note.tags.join(" "), course?.name ?? ""].join(
        " "
      )
    );
    if (score) {
      hits.push({
        id: note.id,
        kind: "note",
        title: note.title || "Başlıksız not",
        subtitle: note.courseId
          ? `${course?.code || course?.name || "Okul"} · ${note.topic}`
          : `Kişisel · ${note.topic}`,
        page: note.courseId ? "school" : "notes",
        score
      });
    }
    note.attachments.forEach((attachment) => {
      const attachmentScore = rank(
        query,
        attachment.originalName,
        attachment.annotations.map((annotation) => annotation.text).join(" ")
      );
      if (attachmentScore) {
        hits.push({
          id: attachment.id,
          parentId: note.id,
          kind: "pdf",
          title: attachment.originalName,
          subtitle: `${note.title || "Başlıksız not"} içinde PDF`,
          page: note.courseId ? "school" : "notes",
          score: attachmentScore
        });
      }
    });
  });

  data.plannerItems.forEach((item) => {
    const score = rank(query, item.title, `${item.details} ${item.date}`);
    if (score)
      hits.push({
        id: item.id,
        kind: "planner",
        title: item.title,
        subtitle: `${item.date}${item.time ? ` · ${item.time}` : ""}`,
        page: "calendar",
        score
      });
  });

  data.goals.forEach((goal) => {
    const score = rank(query, goal.title, `${goal.description} ${goal.category}`);
    if (score)
      hits.push({
        id: goal.id,
        kind: "goal",
        title: goal.title,
        subtitle: `Hedef · %${goal.progress}`,
        page: "goals",
        score
      });
  });

  data.courses.forEach((course) => {
    const score = rank(query, course.name, course.code);
    if (score)
      hits.push({
        id: course.id,
        kind: "course",
        title: course.name,
        subtitle: course.code || "Ders",
        page: "school",
        score
      });
  });

  data.grades.forEach((grade) => {
    const score = rank(query, grade.course, `${grade.letter} ${grade.ects}`);
    if (score)
      hits.push({
        id: grade.id,
        kind: "grade",
        title: grade.course,
        subtitle: `${grade.letter} · ${grade.ects} AKTS`,
        page: "school",
        score
      });
  });

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "tr"))
    .slice(0, 12);
}
