import { useEffect, useMemo, useState } from "react";
import type { AppData, Course, Page } from "./types";
import { COURSE_COLORS, loadAppData, persistAppData, uid } from "./lib/data";
import Sidebar from "./components/Sidebar";
import NotesPage from "./components/NotesPage";
import RemindersPage from "./components/RemindersPage";
import GradesPage from "./components/GradesPage";
import SettingsPage from "./components/SettingsPage";
import Modal from "./components/Modal";
import Icon from "./components/Icon";

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [page, setPage] = useState<Page>("notes");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseModal, setCourseModal] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseColor, setCourseColor] = useState(COURSE_COLORS[0]);
  const [toast, setToast] = useState("");
  const [focusReminderId, setFocusReminderId] = useState<string | null>(null);
  useEffect(() => {
    loadAppData().then((loaded) => {
      setData(loaded);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    document.documentElement.dataset.theme = data.settings.theme;
    const timer = window.setTimeout(() => persistAppData(data), 350);
    const reminders = data.reminders.map((reminder) => ({
      ...reminder,
      courseName: data.courses.find((course) => course.id === reminder.courseId)
        ?.name
    }));
    window.notebookAPI?.syncReminders(reminders);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPage("notes");
        requestAnimationFrame(() => {
          document.querySelector<HTMLInputElement>(".global-search input")?.focus();
        });
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const unsubscribe = window.notebookAPI?.onReminderOpen((id) => {
      setPage("reminders");
      setFocusReminderId(id);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const placeholder = useMemo(() => {
    if (page === "notes") return "Notlarda, konularda ve etiketlerde ara…";
    if (page === "reminders") return "Planlayıcı açık";
    if (page === "grades") return "Doğuş Üniversitesi AKTS sistemi";
    return "Yerel ve çevrimdışı";
  }, [page]);

  function addCourse(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !courseName.trim()) return;
    const course: Course = {
      id: uid(),
      name: courseName.trim(),
      code: courseCode.trim(),
      color: courseColor,
      createdAt: new Date().toISOString()
    };
    setData({ ...data, courses: [...data.courses, course] });
    setActiveCourseId(course.id);
    setPage("notes");
    setCourseName("");
    setCourseCode("");
    setCourseColor(
      COURSE_COLORS[(data.courses.length + 1) % COURSE_COLORS.length]
    );
    setCourseModal(false);
    setToast("Ders eklendi.");
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="brand-mark large">
          <span />
          <span />
          <span />
        </div>
        <strong>Notebook-PC hazırlanıyor…</strong>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onPageChange={setPage}
        courses={data.courses}
        activeCourseId={activeCourseId}
        onCourseChange={setActiveCourseId}
        onAddCourse={() => setCourseModal(true)}
      />
      <section className="workspace">
        <header className="topbar">
          <div className={`global-search ${page !== "notes" ? "muted" : ""}`}>
            <Icon name="search" size={18} />
            <input
              value={page === "notes" ? search : ""}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
              disabled={page !== "notes"}
            />
            {page === "notes" && search && (
              <button onClick={() => setSearch("")} aria-label="Aramayı temizle">
                ×
              </button>
            )}
            {page === "notes" && !search && <kbd>Ctrl K</kbd>}
          </div>
          <div className="topbar-actions">
            <div className="today-chip">
              <Icon name="calendar" size={16} />
              {new Intl.DateTimeFormat("tr-TR", {
                weekday: "short",
                day: "numeric",
                month: "short"
              }).format(new Date())}
            </div>
            <button
              className="notification-button"
              onClick={() => setPage("reminders")}
              aria-label="Alarmlar"
            >
              <Icon name="bell" size={19} />
              {data.reminders.some((item) => !item.completed) && <span />}
            </button>
          </div>
        </header>

        <div className="page-host">
          {page === "notes" && (
            <NotesPage
              data={data}
              onDataChange={setData}
              activeCourseId={activeCourseId}
              search={search}
              onToast={setToast}
            />
          )}
          {page === "reminders" && (
            <RemindersPage
              data={data}
              onDataChange={setData}
              focusReminderId={focusReminderId}
              onFocusHandled={() => setFocusReminderId(null)}
              onToast={setToast}
            />
          )}
          {page === "grades" && (
            <GradesPage data={data} onDataChange={setData} />
          )}
          {page === "settings" && (
            <SettingsPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
            />
          )}
        </div>
      </section>

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

      {toast && (
        <div className="toast">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
