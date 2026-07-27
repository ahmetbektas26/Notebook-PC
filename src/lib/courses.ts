import type { AppData } from "../types";

export interface CourseRemovalResult {
  data: AppData;
  movedNotes: number;
  removed: boolean;
}

export function removeCourseAndPreserveNotes(
  data: AppData,
  courseId: string
): CourseRemovalResult {
  if (!data.courses.some((course) => course.id === courseId)) {
    return { data, movedNotes: 0, removed: false };
  }

  let movedNotes = 0;
  const notes = data.notes.map((note) => {
    if (note.courseId !== courseId) return note;
    movedNotes += 1;
    return { ...note, courseId: null };
  });

  return {
    data: {
      ...data,
      courses: data.courses.filter((course) => course.id !== courseId),
      notes
    },
    movedNotes,
    removed: true
  };
}
