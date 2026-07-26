import { useMemo, useState } from "react";
import type { AppData, Goal, GoalCategory } from "../types";
import { uid } from "../lib/data";
import Icon from "./Icon";

interface GoalsPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
}

const CATEGORIES: Record<GoalCategory, string> = {
  personal: "Kişisel",
  health: "Sağlık",
  career: "Kariyer",
  finance: "Finans",
  learning: "Öğrenme"
};

export default function GoalsPage({
  data,
  onDataChange,
  onToast
}: GoalsPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("personal");
  const [deadline, setDeadline] = useState("");
  const [showForm, setShowForm] = useState(false);

  const average = useMemo(
    () =>
      data.goals.length
        ? Math.round(
            data.goals.reduce((sum, goal) => sum + goal.progress, 0) /
              data.goals.length
          )
        : 0,
    [data.goals]
  );

  function addGoal(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const goal: Goal = {
      id: uid(),
      title: title.trim(),
      description: description.trim(),
      category,
      progress: 0,
      deadline,
      createdAt: new Date().toISOString()
    };
    onDataChange({ ...data, goals: [goal, ...data.goals] });
    setTitle("");
    setDescription("");
    setDeadline("");
    setCategory("personal");
    setShowForm(false);
    onToast("Yeni hedef oluşturuldu.");
  }

  function updateGoal(id: string, patch: Partial<Goal>) {
    onDataChange({
      ...data,
      goals: data.goals.map((goal) =>
        goal.id === id ? { ...goal, ...patch } : goal
      )
    });
  }

  function removeGoal(goal: Goal) {
    if (!window.confirm(`“${goal.title}” hedefi silinsin mi?`)) return;
    onDataChange({
      ...data,
      goals: data.goals.filter((item) => item.id !== goal.id)
    });
  }

  const completed = data.goals.filter((goal) => goal.progress === 100).length;

  return (
    <div className="page-scroll goals-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">KENDİ YOLUN</span>
          <h1>Kişisel hedefler</h1>
          <p>Büyük hedefleri görünür kıl, ilerlemeni güncelle ve yönünü koru.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          <Icon name="plus" size={17} />
          Yeni hedef
        </button>
      </div>

      <div className="goal-stats">
        <div>
          <span>Aktif hedef</span>
          <strong>{data.goals.length - completed}</strong>
        </div>
        <div>
          <span>Tamamlanan</span>
          <strong>{completed}</strong>
        </div>
        <div>
          <span>Genel ilerleme</span>
          <strong>%{average}</strong>
        </div>
      </div>

      {showForm && (
        <form className="new-goal-form" onSubmit={addGoal}>
          <div>
            <span className="eyebrow">YENİ HEDEF</span>
            <h2>Nereye ulaşmak istiyorsun?</h2>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Hedef başlığı"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Bu hedef senin için neden önemli?"
          />
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as GoalCategory)
            }
          >
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
          <button className="primary-button" type="submit">
            Hedefi oluştur
          </button>
        </form>
      )}

      {data.goals.length === 0 ? (
        <div className="empty-state goals-empty">
          <Icon name="target" size={38} />
          <strong>İlk hedefini belirle</strong>
          <span>
            Kariyer, sağlık, öğrenme, finans veya tamamen kişisel bir hedef
            olabilir.
          </span>
          <button className="secondary-button" onClick={() => setShowForm(true)}>
            Hedef ekle
          </button>
        </div>
      ) : (
        <div className="goal-cards">
          {data.goals.map((goal) => (
            <article
              className={`goal-card-item ${goal.progress === 100 ? "complete" : ""}`}
              key={goal.id}
            >
              <div className="goal-card-top">
                <span className={`goal-category ${goal.category}`}>
                  {CATEGORIES[goal.category]}
                </span>
                <button
                  className="plain-icon"
                  onClick={() => removeGoal(goal)}
                  aria-label="Hedefi sil"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
              <h2>{goal.title}</h2>
              <p>{goal.description || "Açıklama eklenmedi."}</p>
              {goal.deadline && (
                <span className="goal-deadline">
                  <Icon name="calendar" size={14} />
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  }).format(new Date(`${goal.deadline}T12:00:00`))}
                </span>
              )}
              <div className="goal-progress-head">
                <span>İlerleme</span>
                <strong>%{goal.progress}</strong>
              </div>
              <input
                className="goal-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={goal.progress}
                onChange={(event) =>
                  updateGoal(goal.id, {
                    progress: Number(event.target.value)
                  })
                }
                style={{ "--value": `${goal.progress}%` } as React.CSSProperties}
              />
              <button
                className="complete-goal"
                onClick={() =>
                  updateGoal(goal.id, {
                    progress: goal.progress === 100 ? 0 : 100
                  })
                }
              >
                <Icon name="check" size={15} />
                {goal.progress === 100
                  ? "Yeniden aç"
                  : "Tamamlandı olarak işaretle"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
