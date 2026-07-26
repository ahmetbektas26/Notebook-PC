import { useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Note, NoteTemplate } from "../types";
import { uid } from "../lib/data";
import { allTemplates } from "../lib/templates";
import Icon from "./Icon";
import Modal from "./Modal";
import PdfAttachments from "./PdfAttachments";
import Recorder from "./Recorder";

interface NotesPageProps {
  data: AppData;
  onDataChange: (data: AppData) => void;
  scope: "personal" | "school";
  activeCourseId: string | null;
  search: string;
  onToast: (message: string) => void;
  focusNoteId?: string | null;
  focusAttachmentId?: string | null;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
    </>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="markdown-preview">
      {content.split("\n").map((line, index) => {
        if (line.startsWith("# "))
          return <h1 key={index}>{line.slice(2)}</h1>;
        if (line.startsWith("## "))
          return <h2 key={index}>{line.slice(3)}</h2>;
        if (line.startsWith("- [ ] "))
          return (
            <label className="preview-check" key={index}>
              <input type="checkbox" disabled />
              <InlineText text={line.slice(6)} />
            </label>
          );
        if (line.startsWith("- "))
          return (
            <div className="preview-list" key={index}>
              <span>•</span>
              <InlineText text={line.slice(2)} />
            </div>
          );
        return line ? (
          <p key={index}>
            <InlineText text={line} />
          </p>
        ) : (
          <div className="preview-gap" key={index} />
        );
      })}
    </div>
  );
}

export default function NotesPage({
  data,
  onDataChange,
  scope,
  activeCourseId,
  search,
  onToast,
  focusNoteId,
  focusAttachmentId
}: NotesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    data.notes[0]?.id ?? null
  );
  const [preview, setPreview] = useState(false);
  const [templatePicker, setTemplatePicker] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const query = search.trim().toLocaleLowerCase("tr-TR");

  const notes = useMemo(
    () =>
      data.notes
        .filter((note) =>
          scope === "personal" ? note.courseId === null : note.courseId !== null
        )
        .filter(
          (note) =>
            scope === "personal" ||
            !activeCourseId ||
            note.courseId === activeCourseId
        )
        .filter((note) => {
          if (!query) return true;
          return [note.title, note.topic, note.content, ...note.tags]
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(query);
        })
        .sort(
          (a, b) =>
            Number(b.favorite) - Number(a.favorite) ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [activeCourseId, data.notes, query, scope]
  );

  const selected = notes.find((note) => note.id === selectedId) ?? notes[0] ?? null;

  useEffect(() => {
    if (notes.length && !notes.some((note) => note.id === selectedId)) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  useEffect(() => {
    if (focusNoteId && data.notes.some((note) => note.id === focusNoteId)) {
      setSelectedId(focusNoteId);
    }
  }, [data.notes, focusNoteId]);

  function createNote(template?: NoteTemplate) {
    const courseId =
      scope === "personal" ? null : activeCourseId ?? data.courses[0]?.id ?? null;
    if (scope === "school" && !courseId) {
      onToast("Önce bir ders eklemelisin.");
      return;
    }
    const now = new Date().toISOString();
    const note: Note = {
      id: uid(),
      courseId,
      topic: template?.topic || "Yeni konu",
      title: template?.title || "Başlıksız not",
      content: template?.content || "",
      tags: template?.tags || [],
      favorite: false,
      createdAt: now,
      updatedAt: now,
      audio: [],
      attachments: []
    };
    onDataChange({ ...data, notes: [note, ...data.notes] });
    setSelectedId(note.id);
    setPreview(false);
    setTemplatePicker(false);
    onToast(
      template
        ? `“${template.name}” şablonuyla not oluşturuldu.`
        : "Yeni not oluşturuldu."
    );
  }

  function updateNote(patch: Partial<Note>) {
    if (!selected) return;
    onDataChange({
      ...data,
      notes: data.notes.map((note) =>
        note.id === selected.id
          ? { ...note, ...patch, updatedAt: new Date().toISOString() }
          : note
      )
    });
  }

  async function deleteNote() {
    if (!selected || !window.confirm(`“${selected.title}” notu silinsin mi?`))
      return;
    if (window.notebookAPI) {
      await Promise.all([
        ...selected.audio.map((audio) =>
          window.notebookAPI!.deleteAudio(audio.fileName)
        ),
        ...selected.attachments.map((attachment) =>
          window.notebookAPI!.deleteAttachment(attachment.fileName)
        )
      ]);
    }
    onDataChange({
      ...data,
      notes: data.notes.filter((note) => note.id !== selected.id)
    });
    setSelectedId(notes.find((note) => note.id !== selected.id)?.id ?? null);
    onToast("Not silindi.");
  }

  function insertFormat(before: string, after = "") {
    if (!selected) return;
    const textarea = editorRef.current;
    const start = textarea?.selectionStart ?? selected.content.length;
    const end = textarea?.selectionEnd ?? selected.content.length;
    const chosen = selected.content.slice(start, end);
    const content =
      selected.content.slice(0, start) +
      before +
      chosen +
      after +
      selected.content.slice(end);
    updateNote({ content });
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(
        start + before.length,
        end + before.length
      );
    });
  }

  const course = selected
    ? data.courses.find((item) => item.id === selected.courseId)
    : null;
  const activeCourse = data.courses.find((item) => item.id === activeCourseId);

  return (
    <div className="notes-layout">
      <section className="notes-index">
        <div className="notes-index-head">
          <div>
            <span className="eyebrow">
              {scope === "personal" ? "KİŞİSEL ALAN" : "DERS NOTLARI"}
            </span>
            <h1>
              {scope === "personal"
                ? "Not defteri"
                : activeCourseId
                  ? activeCourse?.name ?? "Ders notları"
                  : "Tüm ders notları"}
            </h1>
          </div>
          <button
            className="primary-square"
            onClick={() => setTemplatePicker(true)}
            aria-label="Not ekle"
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
        <div className="note-count">
          {notes.length} not
          {query && <span>“{search}” için</span>}
        </div>
        <div className="note-cards">
          {notes.length === 0 ? (
            <div className="empty-state compact">
              <Icon name="book" size={28} />
              <strong>Not bulunamadı</strong>
              <span>Yeni bir not oluştur veya arama filtresini değiştir.</span>
            </div>
          ) : (
            notes.map((note) => {
              const noteCourse = data.courses.find(
                (item) => item.id === note.courseId
              );
              return (
                <button
                  key={note.id}
                  className={`note-card ${selected?.id === note.id ? "active" : ""}`}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="note-card-meta">
                    <span style={{ color: noteCourse?.color }}>
                      {scope === "personal"
                        ? "Kişisel"
                        : noteCourse?.code || noteCourse?.name}
                    </span>
                    {note.favorite && <Icon name="star" size={14} />}
                  </div>
                  <strong>{note.title || "Başlıksız not"}</strong>
                  <p>
                    {note.content
                      .replace(/[#*[\]-]/g, "")
                      .slice(0, 100) || "Henüz içerik yok…"}
                  </p>
                  <div className="note-card-foot">
                    <span>{note.topic}</span>
                    <small>{formatDate(note.updatedAt)}</small>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <main className="editor-shell">
        {!selected ? (
          <div className="empty-editor">
            <div className="empty-editor-icon">
              <Icon name="edit" size={34} />
            </div>
            <h2>Bir not seç</h2>
            <p>Soldaki listeden bir not aç veya yeni not oluştur.</p>
            <button
              className="primary-button"
              onClick={() => setTemplatePicker(true)}
            >
              <Icon name="plus" size={17} />
              Yeni not
            </button>
          </div>
        ) : (
          <>
            <header className="editor-head">
              <div className="editor-breadcrumb">
                <span
                  className="course-chip"
                  style={
                    scope === "school"
                      ? {
                          color: course?.color,
                          backgroundColor: `${course?.color}18`
                        }
                      : undefined
                  }
                >
                  {scope === "personal"
                    ? "Kişisel not"
                    : course?.code || course?.name || "Ders"}
                </span>
                <span>/</span>
                <input
                  value={selected.topic}
                  onChange={(event) => updateNote({ topic: event.target.value })}
                  aria-label="Konu"
                />
              </div>
              <div className="editor-actions">
                <button
                  className={`icon-button ${selected.favorite ? "is-favorite" : ""}`}
                  onClick={() => updateNote({ favorite: !selected.favorite })}
                  aria-label="Favoriye al"
                >
                  <Icon name="star" size={19} />
                </button>
                <button
                  className="icon-button danger-hover"
                  onClick={deleteNote}
                  aria-label="Notu sil"
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </header>

            <div className="editor-content">
              <input
                className="title-input"
                value={selected.title}
                onChange={(event) => updateNote({ title: event.target.value })}
                placeholder="Not başlığı"
              />
              <div className="tag-editor">
                <span>Etiketler</span>
                <input
                  value={selected.tags.join(", ")}
                  onChange={(event) =>
                    updateNote({
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder="algoritma, sınav, önemli"
                />
                <small>Virgülle ayır</small>
              </div>

              <div className="format-toolbar">
                <button onClick={() => insertFormat("**", "**")} title="Kalın">
                  <strong>B</strong>
                </button>
                <button onClick={() => insertFormat("# ")} title="Başlık">
                  H1
                </button>
                <button onClick={() => insertFormat("## ")} title="Alt başlık">
                  H2
                </button>
                <button onClick={() => insertFormat("- ")} title="Liste">
                  • Liste
                </button>
                <button onClick={() => insertFormat("- [ ] ")} title="Görev">
                  □ Görev
                </button>
                <span className="toolbar-spacer" />
                <button
                  className={preview ? "active" : ""}
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? "Düzenle" : "Önizle"}
                </button>
              </div>

              {preview ? (
                <MarkdownPreview content={selected.content} />
              ) : (
                <textarea
                  ref={editorRef}
                  className="note-editor"
                  value={selected.content}
                  onChange={(event) => updateNote({ content: event.target.value })}
                  placeholder="Notunu yazmaya başla…"
                  spellCheck
                />
              )}

              <PdfAttachments
                attachments={selected.attachments}
                onChange={(attachments) => updateNote({ attachments })}
                focusAttachmentId={
                  selected.id === focusNoteId ? focusAttachmentId : null
                }
              />

              <Recorder
                recordings={selected.audio}
                onChange={(audio) => updateNote({ audio })}
              />
            </div>
            <footer className="editor-foot">
              <span>
                <span className="save-dot" />
                Değişiklikler otomatik kaydedilir
              </span>
              <span>Son düzenleme {formatDate(selected.updatedAt)}</span>
            </footer>
          </>
        )}
      </main>

      {templatePicker && (
        <Modal title="Yeni not oluştur" onClose={() => setTemplatePicker(false)}>
          <div className="template-picker">
            {allTemplates(data.templates)
              .filter(
                (template) =>
                  template.id === "blank" || template.scope === scope
              )
              .map((template) => (
                <button
                  key={template.id}
                  onClick={() => createNote(template)}
                >
                  <span className={`template-picker-icon ${template.scope}`}>
                    <Icon
                      name={
                        template.scope === "school" ? "school" : "template"
                      }
                      size={19}
                    />
                  </span>
                  <span>
                    <strong>{template.name}</strong>
                    <small>{template.description}</small>
                  </span>
                </button>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
