import type {
  AppData,
  Course,
  Goal,
  GoalCategory,
  GradeEntry,
  GradeLetter,
  Note,
  PdfAttachment,
  PlannerItem,
  PlannerKind
} from "../types";
import { COURSE_COLORS, migrateAppData, uid } from "./data";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function dataToCsv(data: AppData) {
  const rows: unknown[][] = [
    [
      "type",
      "id",
      "title",
      "details",
      "date",
      "time",
      "status",
      "tags",
      "course",
      "ects",
      "grade"
    ]
  ];
  data.courses.forEach((course) =>
    rows.push([
      "course",
      course.id,
      course.name,
      course.code,
      course.createdAt,
      "",
      "",
      course.color
    ])
  );
  data.notes.forEach((note) =>
    rows.push([
      "note",
      note.id,
      note.title,
      note.content,
      note.updatedAt,
      "",
      note.favorite ? "favorite" : "",
      [note.topic, ...note.tags].join("|"),
      data.courses.find((course) => course.id === note.courseId)?.name ?? ""
    ])
  );
  data.plannerItems.forEach((item) =>
    rows.push([
      "planner",
      item.id,
      item.title,
      item.details,
      item.date,
      item.time,
      item.completed ? "completed" : "open",
      item.kind
    ])
  );
  data.goals.forEach((goal) =>
    rows.push([
      "goal",
      goal.id,
      goal.title,
      goal.description,
      goal.deadline,
      "",
      goal.progress,
      goal.category
    ])
  );
  data.grades.forEach((grade) =>
    rows.push([
      "grade",
      grade.id,
      grade.course,
      "",
      "",
      "",
      "",
      "",
      "",
      grade.ects,
      grade.letter
    ])
  );
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function dataToMarkdown(data: AppData) {
  const courseName = (id: string | null) =>
    data.courses.find((course) => course.id === id)?.name ?? "Kişisel";
  const notes = data.notes
    .map(
      (note) =>
        `# ${note.title || "Başlıksız not"}\n\n` +
        `> Alan: ${courseName(note.courseId)} · Konu: ${note.topic}` +
        `${note.tags.length ? ` · Etiketler: ${note.tags.join(", ")}` : ""}\n\n` +
        `${note.content}\n\n` +
        (note.attachments.length
          ? `## PDF ekleri\n${note.attachments
              .map(
                (file) =>
                  `- ${file.originalName} (${file.annotations.length} işaret)`
              )
              .join("\n")}\n\n`
          : "")
    )
    .join("\n---\n\n");
  const planner = data.plannerItems
    .map(
      (item) =>
        `- [${item.completed ? "x" : " "}] ${item.date} ${item.time} — ${item.title}${item.details ? `: ${item.details}` : ""}`
    )
    .join("\n");
  const goals = data.goals
    .map((goal) => `- ${goal.title} — %${goal.progress}`)
    .join("\n");
  const grades = data.grades
    .map((grade) => `- ${grade.course}: ${grade.letter} (${grade.ects} AKTS)`)
    .join("\n");
  return `# Notebook-PC Dışa Aktarımı\n\n## Notlar\n\n${notes || "Not yok."}\n\n## Takvim ve görevler\n${planner || "Kayıt yok."}\n\n## Hedefler\n${goals || "Hedef yok."}\n\n## Okul notları\n${grades || "Ders notu yok."}\n`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function dataToPrintableHtml(data: AppData) {
  const notes = data.notes
    .map(
      (note) => `<article>
        <h2>${escapeHtml(note.title || "Başlıksız not")}</h2>
        <p class="meta">${escapeHtml(note.topic)} · ${escapeHtml(
          note.tags.join(", ")
        )}</p>
        <pre>${escapeHtml(note.content)}</pre>
      </article>`
    )
    .join("");
  const grades = data.grades
    .map(
      (grade) =>
        `<tr><td>${escapeHtml(grade.course)}</td><td>${grade.ects}</td><td>${escapeHtml(
          grade.letter
        )}</td></tr>`
    )
    .join("");
  const tasks = data.plannerItems
    .map(
      (item) =>
        `<li>${item.completed ? "✓" : "○"} ${escapeHtml(item.date)} ${escapeHtml(
          item.time
        )} — ${escapeHtml(item.title)}</li>`
    )
    .join("");
  const goals = data.goals
    .map(
      (goal) =>
        `<li>${escapeHtml(goal.title)} <strong>%${goal.progress}</strong></li>`
    )
    .join("");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
    <style>
      @page { size: A4; margin: 18mm; }
      body { font: 12px/1.55 "Segoe UI", Arial, sans-serif; color:#202536; }
      h1 { font-size:25px; border-bottom:2px solid #e3a72f; padding-bottom:10px; }
      h2 { font-size:17px; margin:0 0 5px; }
      h3 { font-size:15px; margin-top:26px; }
      article { break-inside:avoid; margin:20px 0; padding-bottom:15px; border-bottom:1px solid #ddd; }
      .meta { color:#697083; font-size:10px; }
      pre { white-space:pre-wrap; font:inherit; }
      li { margin:5px 0; }
      table { width:100%; border-collapse:collapse; }
      th, td { padding:7px; border:1px solid #ddd; text-align:left; }
    </style></head><body>
    <h1>Notebook-PC</h1>
    <p>${new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(new Date())} tarihinde dışa aktarıldı.</p>
    <h3>Notlar</h3>${notes || "<p>Not yok.</p>"}
    <h3>Takvim ve görevler</h3><ul>${tasks || "<li>Kayıt yok.</li>"}</ul>
    <h3>Hedefler</h3><ul>${goals || "<li>Hedef yok.</li>"}</ul>
    <h3>Not ortalaması kayıtları</h3>
    <table><thead><tr><th>Ders</th><th>AKTS</th><th>Harf</th></tr></thead>
    <tbody>${grades || '<tr><td colspan="3">Kayıt yok.</td></tr>'}</tbody></table>
    </body></html>`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("CSV dosyasında kapanmamış bir tırnak var.");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

export function mergeCsv(data: AppData, text: string): AppData {
  const rows = parseCsv(text);
  const supportedTypes = new Set(["course", "note", "planner", "goal", "grade"]);
  if (!rows.some((row) => supportedTypes.has(row.type))) {
    throw new Error("CSV dosyasında desteklenen Notebook-PC kaydı bulunamadı.");
  }
  const courses = [...data.courses];
  const courseMap = new Map<string, string>();
  rows
    .filter((row) => row.type === "course")
    .forEach((row, index) => {
      const course: Course = {
        id: uid(),
        name: row.title || "İçe aktarılan ders",
        code: row.details || "",
        color:
          row.tags || COURSE_COLORS[(courses.length + index) % COURSE_COLORS.length],
        createdAt: row.date || new Date().toISOString()
      };
      courses.push(course);
      courseMap.set(course.name, course.id);
    });

  const notes: Note[] = [];
  const plannerItems: PlannerItem[] = [];
  const goals: Goal[] = [];
  const grades: GradeEntry[] = [];
  rows.forEach((row) => {
    const now = new Date().toISOString();
    if (row.type === "note") {
      const [topic = "İçe aktarılan", ...tags] = (row.tags || "").split("|");
      notes.push({
        id: uid(),
        courseId:
          courseMap.get(row.course) ??
          courses.find((course) => course.name === row.course)?.id ??
          null,
        topic,
        title: row.title || "İçe aktarılan not",
        content: row.details || "",
        tags,
        favorite: row.status === "favorite",
        createdAt: row.date || now,
        updatedAt: row.date || now,
        audio: [],
        attachments: []
      });
    }
    if (row.type === "planner") {
      plannerItems.push({
        id: uid(),
        title: row.title || "İçe aktarılan plan",
        details: row.details || "",
        date: row.date || now.slice(0, 10),
        time: row.time || "",
        kind: (["task", "plan", "note", "goal"].includes(row.tags)
          ? row.tags
          : "task") as PlannerKind,
        reminder: false,
        repeat: "none",
        completed: row.status === "completed",
        completedAt: row.status === "completed" ? now : undefined,
        createdAt: now
      });
    }
    if (row.type === "goal") {
      goals.push({
        id: uid(),
        title: row.title || "İçe aktarılan hedef",
        description: row.details || "",
        category: ([
          "personal",
          "health",
          "career",
          "finance",
          "learning"
        ].includes(row.tags)
          ? row.tags
          : "personal") as GoalCategory,
        progress: Math.min(100, Math.max(0, Number(row.status) || 0)),
        deadline: row.date || "",
        createdAt: now
      });
    }
    if (row.type === "grade") {
      grades.push({
        id: uid(),
        course: row.title || "İçe aktarılan ders",
        ects: Number(row.ects) || 0,
        letter: ([
          "A+",
          "A",
          "B+",
          "B",
          "C+",
          "C",
          "D+",
          "D",
          "F"
        ].includes(row.grade)
          ? row.grade
          : "F") as GradeLetter
      });
    }
  });
  const merged = {
    ...data,
    courses,
    notes: [...notes, ...data.notes],
    plannerItems: [...data.plannerItems, ...plannerItems],
    goals: [...goals, ...data.goals],
    grades: [...data.grades, ...grades]
  };
  return migrateAppData(merged) ?? data;
}

export function markdownFileToNote(name: string, content: string): Note {
  const title =
    content.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
    name.replace(/\.(md|markdown)$/i, "");
  const now = new Date().toISOString();
  return {
    id: uid(),
    courseId: null,
    topic: "İçe aktarılan",
    title,
    content,
    tags: ["içe-aktarıldı"],
    favorite: false,
    createdAt: now,
    updatedAt: now,
    audio: [],
    attachments: []
  };
}

export function pdfFileToNote(
  originalName: string,
  attachment: PdfAttachment
): Note {
  const now = new Date().toISOString();
  return {
    id: uid(),
    courseId: null,
    topic: "PDF",
    title: originalName.replace(/\.pdf$/i, ""),
    content: "Bu not PDF içe aktarma işlemiyle oluşturuldu.",
    tags: ["pdf", "içe-aktarıldı"],
    favorite: false,
    createdAt: now,
    updatedAt: now,
    audio: [],
    attachments: [attachment]
  };
}
