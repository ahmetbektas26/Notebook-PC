import { useEffect, useMemo, useState } from "react";
import type { AppData, Page } from "./types";
import { loadAppData, persistAppData } from "./lib/data";
import Sidebar from "./components/Sidebar";
import NotesPage from "./components/NotesPage";
import SettingsPage from "./components/SettingsPage";
import Icon from "./components/Icon";
import TodayPage from "./components/TodayPage";
import CalendarPage from "./components/CalendarPage";
import GoalsPage from "./components/GoalsPage";
import SchoolPage from "./components/SchoolPage";

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [page, setPage] = useState<Page>("today");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  useEffect(() => {
    loadAppData().then((loaded) => {
      setData(loaded);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    document.documentElement.dataset.theme = data.settings.theme;
    const timer = window.setTimeout(() => persistAppData(data), 350);
    const reminders = data.plannerItems
      .filter((item) => item.reminder && item.time && !item.completed)
      .map((item) => ({
        id: item.id,
        title: item.title,
        dueAt: new Date(`${item.date}T${item.time}:00`).toISOString(),
        repeat: item.repeat,
        completed: item.completed
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
      setPage("calendar");
      setFocusItemId(id);
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
    if (page === "today") return "Bugünün merkezi";
    if (page === "calendar") return "Takvim ve planlar";
    if (page === "goals") return "Kişisel hedefler";
    if (page === "school") return "Okul alanı";
    return "Yerel, özel ve çevrimdışı";
  }, [page]);

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
              focusItemId={focusItemId}
              onToast={setToast}
            />
          )}
          {page === "goals" && (
            <GoalsPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
            />
          )}
          {page === "notes" && (
            <NotesPage
              data={data}
              onDataChange={setData}
              scope="personal"
              activeCourseId={null}
              search={search}
              onToast={setToast}
            />
          )}
          {page === "school" && (
            <SchoolPage
              data={data}
              onDataChange={setData}
              onToast={setToast}
            />
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

      {toast && (
        <div className="toast">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
