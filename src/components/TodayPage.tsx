import { useEffect, useMemo, useState } from "react";
import type { AppData, Page, PlannerItem, PlannerKind } from "../types";
import { uid } from "../lib/data";
import { PLANNER_KIND_LABELS, todayKey } from "../lib/calendar";
import Icon from "./Icon";

interface TodayPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onNavigate: (page: Page) => void;
  onToast: (message: string) => void;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export default function TodayPage({
  data,
  onDataChange,
  onNavigate,
  onToast
}: TodayPageProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickKind, setQuickKind] = useState<PlannerKind>("task");
  const [quickTime, setQuickTime] = useState("");
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const key = todayKey();

  const todayItems = useMemo(
    () =>
      data.plannerItems
        .filter((item) => item.date === key)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [data.plannerItems, key]
  );
  const activeGoals = data.goals
    .filter((goal) => goal.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = window.setInterval(() => {
      setFocusSeconds((current) => {
        if (current <= 1) {
          setFocusRunning(false);
          onDataChange({
            ...data,
            focusSessions: [
              {
                id: uid(),
                minutes: 25,
                completedAt: new Date().toISOString()
              },
              ...data.focusSessions
            ]
          });
          onToast("Odak süresi tamamlandı.");
          return 25 * 60;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [data, focusRunning, onDataChange, onToast]);

  function addQuick(event: React.FormEvent) {
    event.preventDefault();
    if (!quickTitle.trim()) return;
    const item: PlannerItem = {
      id: uid(),
      title: quickTitle.trim(),
      details: "",
      date: key,
      time: quickTime,
      kind: quickKind,
      reminder: false,
      repeat: "none",
      completed: false,
      createdAt: new Date().toISOString()
    };
    onDataChange({ ...data, plannerItems: [...data.plannerItems, item] });
    setQuickTitle("");
    setQuickTime("");
    onToast("Bugüne eklendi.");
  }

  function toggleItem(id: string) {
    onDataChange({
      ...data,
      plannerItems: data.plannerItems.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: item.completed ? undefined : new Date().toISOString()
            }
          : item
      )
    });
  }

  const done = todayItems.filter((item) => item.completed).length;
  const completion = todayItems.length
    ? Math.round((done / todayItems.length) * 100)
    : 0;

  return (
    <div className="page-scroll today-page">
      <div className="today-hero">
        <div>
          <span className="eyebrow">BUGÜNÜN MERKEZİ</span>
          <h1>{greeting()}.</h1>
          <p>
            {new Intl.DateTimeFormat("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            }).format(new Date())}
          </p>
        </div>
        <div className="daily-ring" style={{ "--progress": `${completion * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>%{completion}</strong>
            <span>tamamlandı</span>
          </div>
        </div>
      </div>

      <form className="quick-capture" onSubmit={addQuick}>
        <div className="quick-capture-icon">
          <Icon name="plus" size={19} />
        </div>
        <input
          value={quickTitle}
          onChange={(event) => setQuickTitle(event.target.value)}
          placeholder="Bugüne hızlıca bir görev, plan, not veya hedef ekle…"
        />
        <select
          value={quickKind}
          onChange={(event) => setQuickKind(event.target.value as PlannerKind)}
        >
          {Object.entries(PLANNER_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={quickTime}
          onChange={(event) => setQuickTime(event.target.value)}
          aria-label="Saat"
        />
        <button type="submit">Ekle</button>
      </form>

      <div className="today-grid">
        <section className="today-agenda-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">GÜNÜN AKIŞI</span>
              <h2>Bugün yapacakların</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("calendar")}>
              Takvimi aç →
            </button>
          </div>
          {todayItems.length === 0 ? (
            <div className="soft-empty">
              <Icon name="sun" size={27} />
              <strong>Bugün tertemiz</strong>
              <span>Yukarıdan ilk planını ekleyebilirsin.</span>
            </div>
          ) : (
            <div className="today-list">
              {todayItems.map((item) => (
                <article className={item.completed ? "done" : ""} key={item.id}>
                  <button
                    className="check-button"
                    onClick={() => toggleItem(item.id)}
                    aria-label="Tamamlandı"
                  >
                    {item.completed && <Icon name="check" size={14} />}
                  </button>
                  <span className={`kind-mark ${item.kind}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {PLANNER_KIND_LABELS[item.kind]}
                      {item.time && ` · ${item.time}`}
                    </span>
                  </div>
                  {item.reminder && <Icon name="bell" size={15} />}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="focus-card">
          <span className="eyebrow">ODAK MODU</span>
          <h2>Şimdiye odaklan</h2>
          <div className={`focus-clock ${focusRunning ? "running" : ""}`}>
            {formatTimer(focusSeconds)}
          </div>
          <p>25 dakikalık dikkat dağıtıcısız çalışma turu.</p>
          <div>
            <button
              className="primary-button"
              onClick={() => setFocusRunning(!focusRunning)}
            >
              <Icon name={focusRunning ? "pause" : "play"} size={16} />
              {focusRunning ? "Duraklat" : "Başlat"}
            </button>
            <button
              className="icon-button"
              onClick={() => {
                setFocusRunning(false);
                setFocusSeconds(25 * 60);
              }}
              aria-label="Sıfırla"
            >
              <Icon name="rotate" size={17} />
            </button>
          </div>
        </aside>

        <section className="today-goals-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">YÖNÜN</span>
              <h2>Aktif hedefler</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("goals")}>
              Tümünü gör →
            </button>
          </div>
          {activeGoals.length === 0 ? (
            <div className="soft-empty horizontal">
              <Icon name="target" size={24} />
              <div>
                <strong>Henüz kişisel hedef yok</strong>
                <span>Kendine bir yön belirlemek için hedef ekle.</span>
              </div>
            </div>
          ) : (
            <div className="mini-goals">
              {activeGoals.map((goal) => (
                <article key={goal.id}>
                  <div>
                    <strong>{goal.title}</strong>
                    <span>%{goal.progress}</span>
                  </div>
                  <div className="progress-track">
                    <i style={{ width: `${goal.progress}%` }} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="today-notes-card">
          <div>
            <span className="eyebrow">FİKİRLERİN</span>
            <strong>{data.notes.filter((note) => note.courseId === null).length}</strong>
            <span>Kişisel not</span>
          </div>
          <button className="secondary-button" onClick={() => onNavigate("notes")}>
            <Icon name="book" size={16} />
            Not defterini aç
          </button>
        </section>
      </div>
    </div>
  );
}
