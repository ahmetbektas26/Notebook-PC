import { useState } from "react";
import type { AppData, NoteTemplate } from "../types";
import { allTemplates } from "../lib/templates";
import { uid } from "../lib/data";
import Icon from "./Icon";
import Modal from "./Modal";

interface TemplatesPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onToast: (message: string) => void;
}

interface TemplateDraft {
  name: string;
  description: string;
  scope: "personal" | "school";
  topic: string;
  title: string;
  content: string;
  tags: string;
}

const emptyDraft: TemplateDraft = {
  name: "",
  description: "",
  scope: "personal",
  topic: "",
  title: "",
  content: "",
  tags: ""
};

export default function TemplatesPage({
  data,
  onDataChange,
  onToast
}: TemplatesPageProps) {
  const [editing, setEditing] = useState<NoteTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const templates = allTemplates(data.templates);

  function openNew() {
    setEditing(null);
    setDraft(emptyDraft);
    setShowForm(true);
  }

  function openEdit(template: NoteTemplate) {
    setEditing(template);
    setDraft({
      name: template.name,
      description: template.description,
      scope: template.scope,
      topic: template.topic,
      title: template.title,
      content: template.content,
      tags: template.tags.join(", ")
    });
    setShowForm(true);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const template: NoteTemplate = {
      id: editing?.id ?? uid(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      scope: draft.scope,
      topic: draft.topic.trim() || "Genel",
      title: draft.title.trim() || "Başlıksız not",
      content: draft.content,
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: editing?.createdAt ?? new Date().toISOString()
    };
    onDataChange({
      ...data,
      templates: editing
        ? data.templates.map((item) =>
            item.id === editing.id ? template : item
          )
        : [template, ...data.templates]
    });
    setShowForm(false);
    onToast(editing ? "Şablon güncellendi." : "Yeni şablon kaydedildi.");
  }

  function remove(template: NoteTemplate) {
    if (!window.confirm(`“${template.name}” şablonu silinsin mi?`)) return;
    onDataChange({
      ...data,
      templates: data.templates.filter((item) => item.id !== template.id)
    });
  }

  return (
    <div className="page-scroll templates-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DAHA HIZLI BAŞLA</span>
          <h1>Not şablonları</h1>
          <p>
            Hazır düzenleri kullan veya kendi tekrar kullanılabilir not yapını
            oluştur.
          </p>
        </div>
        <button className="primary-button" onClick={openNew}>
          <Icon name="plus" size={17} />
          Yeni şablon
        </button>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <article key={template.id}>
            <div className="template-card-head">
              <span className={`template-scope ${template.scope}`}>
                {template.scope === "school" ? "Okul" : "Kişisel"}
              </span>
              <span>{template.builtIn ? "Hazır" : "Benim şablonum"}</span>
            </div>
            <Icon
              name={template.scope === "school" ? "school" : "template"}
              size={25}
            />
            <h2>{template.name}</h2>
            <p>{template.description || "Özel not şablonu."}</p>
            <small>{template.content.split("\n").slice(0, 2).join(" ")}</small>
            {!template.builtIn && (
              <div className="template-actions">
                <button
                  className="secondary-button"
                  onClick={() => openEdit(template)}
                >
                  Düzenle
                </button>
                <button
                  className="plain-icon"
                  onClick={() => remove(template)}
                  aria-label="Şablonu sil"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {showForm && (
        <Modal
          title={editing ? "Şablonu düzenle" : "Yeni şablon"}
          onClose={() => setShowForm(false)}
        >
          <form className="modal-form template-form" onSubmit={save}>
            <label>
              Şablon adı
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="Örn. Müşteri görüşmesi"
                autoFocus
              />
            </label>
            <label>
              Kısa açıklama
              <input
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                placeholder="Bu şablon ne zaman kullanılacak?"
              />
            </label>
            <div className="form-two">
              <label>
                Alan
                <select
                  value={draft.scope}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      scope: event.target.value as "personal" | "school"
                    })
                  }
                >
                  <option value="personal">Kişisel</option>
                  <option value="school">Okul</option>
                </select>
              </label>
              <label>
                Konu
                <input
                  value={draft.topic}
                  onChange={(event) =>
                    setDraft({ ...draft, topic: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Varsayılan başlık
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </label>
            <label>
              Şablon içeriği
              <textarea
                value={draft.content}
                onChange={(event) =>
                  setDraft({ ...draft, content: event.target.value })
                }
                placeholder="# Başlık&#10;&#10;## Bölüm"
              />
            </label>
            <label>
              Etiketler
              <input
                value={draft.tags}
                onChange={(event) =>
                  setDraft({ ...draft, tags: event.target.value })
                }
                placeholder="Virgülle ayır"
              />
            </label>
            <button className="primary-button wide" type="submit">
              Şablonu kaydet
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
