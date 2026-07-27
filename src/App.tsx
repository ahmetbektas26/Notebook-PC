import { useEffect, useState } from "react";
import type { AppData, Page, SecurityStatus } from "./types";
import { loadAppData, migrateAppData, persistAppData } from "./lib/data";
import type { SearchHit } from "./lib/search";
import Sidebar from "./components/Sidebar";
import NotesPage from "./components/NotesPage";
import SettingsPage from "./components/SettingsPage";
import Icon from "./components/Icon";
import GlobalSearch from "./components/GlobalSearch";
import LockScreen from "./components/LockScreen";
import TodayPage from "./components/TodayPage";
import CalendarPage from "./components/CalendarPage";
import GoalsPage from "./components/GoalsPage";
import SchoolPage from "./components/SchoolPage";
import TemplatesPage from "./components/TemplatesPage";
import WeeklyReviewPage from "./components/WeeklyReviewPage";

interface SearchFocus {
  noteId: string | null;
  attachmentId: string | null;
  plannerId: string | null;
  goalId: string | null;
  courseId: string | null;
  gradeId: string | null;
}

const emptyFocus: SearchFocus = {
  noteId: null,
  attachmentId: null,
  plannerId: null,
  goalId: null,
  courseId: null,
  gradeId: null
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [page, setPage] = useState<Page>("today");
  const [toast, setToast] = useState("");
  const [focus, setFocus] = useState<SearchFocus>(emptyFocus);
  const [startupError, setStartupError] = useState("");
  const [securityStatus, setSecurityStatus] =
    useState<SecurityStatus | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const status = window.notebookAPI
          ? await window.notebookAPI.getSecurityStatus()
          : { enabled: false, locked: false, autoLockMinutes: 0 };
        setSecurityStatus(status);
        if (!status.locked) setData(await loadAppData());
      } catch {
        setStartupError(
          "Yerel veri alanı açılamadı. Dosyalar bozuk veya erişim izni engellenmiş olabilir."
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (!data) return;
    document.documentElement.dataset.theme = data.settings.theme;
    const timer = window.setTimeout(() => {
      void persistAppData(data).catch(() =>
        setToast("Değişiklikler diske kaydedilemedi.")
      );
    }, 350);
    const reminders = data.plannerItems
      .filter((item) => item.reminder && item.time && !item.completed)
      .flatMap((item) => {
        const due = new Date(`${item.date}T${item.time}:00`);
        if (Number.isNaN(due.getTime())) return [];
        return [
          {
            id: item.id,
            title: item.title,
            dueAt: due.toISOString(),
            repeat: item.repeat,
            completed: item.completed
          }
        ];
      });
    void window.notebookAPI?.syncReminders(reminders).catch(() => undefined);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    const unsubscribe = window.notebookAPI?.onReminderOpen((id) => {
      setPage("calendar");
      setFocus({ ...emptyFocus, plannerId: id });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.notebookAPI?.onSecurityLocked(() => {
      setData(null);
      setSecurityStatus((current) =>
        current ? { ...current, locked: true } : current
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (
      !data ||
      !securityStatus?.enabled ||
      securityStatus.autoLockMinutes <= 0
    )
      return;
    let timer = 0;
    const lock = async () => {
      await window.notebookAPI?.lockNow();
      setData(null);
      setSecurityStatus((current) =>
        current ? { ...current, locked: true } : current
      );
    };
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        lock,
        securityStatus.autoLockMinutes * 60 * 1000
      );
    };
    const events = ["pointerdown", "keydown", "wheel"];
    events.forEach((event) => window.addEventListener(event, reset));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [data, securityStatus]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleSearchSelect(hit: SearchHit) {
    setPage(hit.page);
    setFocus({
      noteId:
        hit.kind === "note"
          ? hit.id
          : hit.kind === "pdf"
            ? hit.parentId ?? null
            : null,
      attachmentId: hit.kind === "pdf" ? hit.id : null,
      plannerId: hit.kind === "planner" ? hit.id : null,
      goalId: hit.kind === "goal" ? hit.id : null,
      courseId: hit.kind === "course" ? hit.id : null,
      gradeId: hit.kind === "grade" ? hit.id : null
    });
  }

  function lockView() {
    setData(null);
    setSecurityStatus((current) =>
      current ? { ...current, locked: true } : current
    );
  }

  if (startupError) {
    return (
      <div className="loading-screen loading-error">
        <Icon name="file" size={30} />
        <strong>Notebook-PC başlatılamadı</strong>
        <p>{startupError}</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  if (!securityStatus) {
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

  if (securityStatus.locked) {
    return (
      <LockScreen
        onUnlock={(unlocked, status) => {
          setData(migrateAppData(unlocked) ?? unlocked);
          setSecurityStatus(status);
        }}
      />
    );
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <strong>Veriler hazırlanıyor…</strong>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onPageChange={(next) => {
          setPage(next);
          setFocus(emptyFocus);
        }}
        locked={securityStatus.enabled}
      />
      <section className="workspace">
        <header className="topbar">
          <GlobalSearch data={data} onSelect={handleSearchSelect} />
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
              onClick={() => setPage("calendar")}
              aria-label="Alarmlar"
            >
              <Icon name="bell" size={19} />
              {data.plannerItems.some(
                (item) => item.reminder && !item.completed
              ) && <span />}
            </button>
          </div>
        </header>

        <div className="page-host">
          {page === "today" && (
            <TodayPage
              data={data}
              onDataChange={setData}
              onNavigate={setPage}
              onToast={setToast}
            />
          )}
          {page === "calendar" && (
            <CalendarPage
              data={data}
              onDataChange={setData}
              focusItemId={focus.plannerId}
              onToast={setToast}
            />
          )}
          {page === "review" && (
            <WeeklyReviewPage data={data} onDataChange={setData} />
          )}
          {page === "goals" && (
            <GoalsPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
              focusGoalId={focus.goalId}
            />
          )}
          {page === "notes" && (
            <NotesPage
              data={data}
              onDataChange={setData}
              scope="personal"
              activeCourseId={null}
              search=""
              onToast={setToast}
              focusNoteId={focus.noteId}
              focusAttachmentId={focus.attachmentId}
            />
          )}
          {page === "templates" && (
            <TemplatesPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
            />
          )}
          {page === "school" && (
            <SchoolPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
              focusNoteId={focus.noteId}
              focusAttachmentId={focus.attachmentId}
              focusCourseId={focus.courseId}
              focusGradeId={focus.gradeId}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
              securityStatus={securityStatus}
              onSecurityStatusChange={setSecurityStatus}
              onLock={lockView}
            />
          )}
        </div>
      </section>

      {toast && (
        <div className="toast">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
