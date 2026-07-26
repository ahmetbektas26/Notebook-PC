import { useState } from "react";
import type { AppData, Course } from "../types";
import { COURSE_COLORS, uid } from "../lib/data";
import NotesPage from "./NotesPage";
import GradesPage from "./GradesPage";
import Modal from "./Modal";
import Icon from "./Icon";

interface SchoolPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
}

export default function SchoolPage({
  data,
  onDataChange,
  onToast
}: SchoolPageProps) {
  const [tab, setTab] = useState<"notes" | "grades">("notes");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courseModal, setCourseModal] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseColor, setCourseColor] = useState(COURSE_COLORS[0]);

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
              <button
                key={course.id}
                className={activeCourseId === course.id ? "active" : ""}
                onClick={() => setActiveCourseId(course.id)}
              >
                <span style={{ backgroundColor: course.color }} />
                {course.code || course.name}
              </button>
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
