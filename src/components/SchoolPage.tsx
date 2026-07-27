import { useEffect, useState } from "react";
import type { AppData, Course } from "../types";
import { COURSE_COLORS, uid } from "../lib/data";
import { removeCourseAndPreserveNotes } from "../lib/courses";
import NotesPage from "./NotesPage";
import GradesPage from "./GradesPage";
import Modal from "./Modal";
import Icon from "./Icon";

interface SchoolPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
  focusNoteId?: string | null;
  focusAttachmentId?: string | null;
  focusCourseId?: string | null;
  focusGradeId?: string | null;
}

export default function SchoolPage({
  data,
  onDataChange,
  onToast,
  focusNoteId,
  focusAttachmentId,
  focusCourseId,
  focusGradeId
}: SchoolPageProps) {
  const [tab, setTab] = useState<"notes" | "grades">("notes");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courseModal, setCourseModal] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseColor, setCourseColor] = useState(COURSE_COLORS[0]);

  useEffect(() => {
    if (focusGradeId) {
      setTab("grades");
      return;
    }
    const note = data.notes.find((item) => item.id === focusNoteId);
    if (note?.courseId) {
      setTab("notes");
      setActiveCourseId(note.courseId);
      return;
    }
    if (
      focusCourseId &&
      data.courses.some((course) => course.id === focusCourseId)
    ) {
      setTab("notes");
      setActiveCourseId(focusCourseId);
    }
  }, [data.courses, data.notes, focusCourseId, focusGradeId, focusNoteId]);

  useEffect(() => {
    if (
      activeCourseId &&
      !data.courses.some((course) => course.id === activeCourseId)
    ) {
      setActiveCourseId(null);
    }
  }, [activeCourseId, data.courses]);

  function addCourse(event: React.FormEvent) {
    event.preventDefault();
    if (!courseName.trim()) return;
    const course: Course = {
      id: uid(),
      name: courseName.trim(),
      code: courseCode.trim(),
      color: courseColor,
      createdAt: new Date().toISOString()
    };
    onDataChange({ ...data, courses: [...data.courses, course] });
    setActiveCourseId(course.id);
    setCourseName("");
    setCourseCode("");
    setCourseColor(
      COURSE_COLORS[(data.courses.length + 1) % COURSE_COLORS.length]
    );
    setCourseModal(false);
    onToast("Ders eklendi.");
  }

  function deleteCourse(course: Course) {
    const attachedNotes = data.notes.filter(
      (note) => note.courseId === course.id
    ).length;
    const preservationMessage = attachedNotes
      ? ` Bu derse bağlı ${attachedNotes} not silinmeyecek, kişisel not defterine taşınacak.`
      : "";
    if (
      !window.confirm(
        `“${course.name}” dersi silinsin mi?${preservationMessage}`
      )
    ) {
      return;
    }

    const result = removeCourseAndPreserveNotes(data, course.id);
    if (!result.removed) return;
    if (activeCourseId === course.id) setActiveCourseId(null);
    onDataChange(result.data);
    onToast(
      result.movedNotes
        ? `Ders silindi; ${result.movedNotes} not kişisel deftere taşındı.`
        : "Ders silindi."
    );
  }

  return (
    <div className="school-page">
      <header className="school-header">
        <div>
          <span className="eyebrow">AYRI BİR ÇALIŞMA ALANI</span>
          <h1>Okul</h1>
          <p>Ders notları ve akademik hesaplar, günlük hayatından ayrı dursun.</p>
        </div>
        <div className="school-tabs">
          <button
            className={tab === "notes" ? "active" : ""}
            onClick={() => setTab("notes")}
          >
            <Icon name="book" size={16} />
            Ders notları
          </button>
          <button
            className={tab === "grades" ? "active" : ""}
            onClick={() => setTab("grades")}
          >
            <Icon name="chart" size={16} />
            Not ortalaması
          </button>
        </div>
      </header>

      {tab === "notes" ? (
        <div className="school-notes-area">
          <div className="school-course-bar">
            <button
              className={activeCourseId === null ? "active" : ""}
              onClick={() => setActiveCourseId(null)}
            >
              Tüm dersler
            </button>
            {data.courses.map((course) => (
              <div
                key={course.id}
                className={`course-pill ${
                  activeCourseId === course.id ? "active" : ""
                }`}
              >
                <button
                  className="course-pill-select"
                  onClick={() => setActiveCourseId(course.id)}
                >
                  <span style={{ backgroundColor: course.color }} />
                  {course.code || course.name}
                </button>
                <button
                  className="course-pill-delete"
                  onClick={() => deleteCourse(course)}
                  aria-label={`${course.name} dersini sil`}
                  title="Dersi sil"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
            <button
              className="add-course-pill"
              onClick={() => setCourseModal(true)}
            >
              <Icon name="plus" size={15} />
              Ders ekle
            </button>
          </div>
          <div className="school-notes-host">
            <NotesPage
              data={data}
              onDataChange={onDataChange}
              scope="school"
              activeCourseId={activeCourseId}
              search=""
              onToast={onToast}
              focusNoteId={focusNoteId}
              focusAttachmentId={focusAttachmentId}
            />
          </div>
        </div>
      ) : (
        <GradesPage data={data} onDataChange={onDataChange} />
      )}

      {courseModal && (
        <Modal title="Yeni ders ekle" onClose={() => setCourseModal(false)}>
          <form className="modal-form" onSubmit={addCourse}>
            <label>
              Ders adı
              <input
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                placeholder="Örn. Operating Systems"
                autoFocus
              />
            </label>
            <label>
              Ders kodu
              <input
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                placeholder="Örn. COME 304"
              />
            </label>
            <fieldset>
              <legend>Renk</legend>
              <div className="color-picker">
                {COURSE_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={courseColor === color ? "active" : ""}
                    style={{ backgroundColor: color }}
                    onClick={() => setCourseColor(color)}
                    aria-label={`Renk ${color}`}
                  >
                    {courseColor === color && <Icon name="check" size={16} />}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="primary-button wide" type="submit">
              <Icon name="plus" size={17} />
              Dersi ekle
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
