import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { PdfAttachment } from "../types";
import { uid } from "../lib/data";
import Icon from "./Icon";

const PdfReader = lazy(() => import("./PdfReader"));

interface PdfAttachmentsProps {
  attachments: PdfAttachment[];
  onChange: (attachments: PdfAttachment[]) => void;
  focusAttachmentId?: string | null;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfAttachments({
  attachments,
  onChange,
  focusAttachmentId
}: PdfAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readerId, setReaderId] = useState<string | null>(
    focusAttachmentId ?? null
  );

  useEffect(() => {
    if (
      focusAttachmentId &&
      attachments.some((attachment) => attachment.id === focusAttachmentId)
    ) {
      setReaderId(focusAttachmentId);
    }
  }, [attachments, focusAttachmentId]);

  async function addFiles(files: FileList | File[]) {
    if (busyRef.current) return;
    const selected = Array.from(files);
    if (!selected.length) return;
    if (!window.notebookAPI) {
      setError("PDF ekleme masaüstü sürümünde kullanılabilir.");
      return;
    }
    const invalid = selected.find(
      (file) =>
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    );
    if (invalid) {
      setError("Yalnızca PDF dosyaları ekleyebilirsin.");
      return;
    }
    if (selected.some((file) => file.size > 50 * 1024 * 1024)) {
      setError("Her PDF en fazla 50 MB olabilir.");
      return;
    }

    try {
      busyRef.current = true;
      setBusy(true);
      setError("");
      const created: PdfAttachment[] = [];
      for (const file of selected) {
        const fileName = await window.notebookAPI.saveAttachment(
          await file.arrayBuffer(),
          file.name,
          file.type
        );
        created.push({
          id: uid(),
          fileName,
          originalName: file.name,
          size: file.size,
          createdAt: new Date().toISOString(),
          annotations: []
        });
      }
      onChange([...attachments, ...created]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "PDF dosyası kaydedilemedi."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function openExternal(attachment: PdfAttachment) {
    try {
      setError("");
      await window.notebookAPI?.openAttachment(attachment.fileName);
    } catch {
      setError("PDF açılamadı. Dosya taşınmış veya silinmiş olabilir.");
    }
  }

  function updateAttachment(updated: PdfAttachment) {
    onChange(
      attachments.map((attachment) =>
        attachment.id === updated.id ? updated : attachment
      )
    );
  }

  async function remove(attachment: PdfAttachment) {
    try {
      setError("");
      await window.notebookAPI?.deleteAttachment(attachment.fileName);
      onChange(attachments.filter((item) => item.id !== attachment.id));
      if (readerId === attachment.id) setReaderId(null);
    } catch {
      setError("PDF silinemedi. Dosya kullanımda olabilir.");
    }
  }

  return (
    <section className="pdf-panel">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">PDF EKLERİ</span>
          <p>Ders slaytı, makale veya herhangi bir PDF’yi nota iliştir.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Icon name="plus" size={16} />
          {busy ? "Ekleniyor…" : "PDF ekle"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => event.target.files && addFiles(event.target.files)}
      />

      <button
        className={`pdf-dropzone ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <Icon name="file" size={22} />
        <span>
          PDF’yi buraya sürükle veya <strong>bilgisayardan seç</strong>
        </span>
        <small>Birden fazla dosya · Dosya başına en fazla 50 MB</small>
      </button>

      {error && <p className="inline-error pdf-error">{error}</p>}

      {attachments.length > 0 && (
        <div className="pdf-list">
          {attachments.map((attachment) => (
            <article key={attachment.id}>
              <div className="pdf-file-icon">PDF</div>
              <button
                className="pdf-name"
                onClick={() => setReaderId(attachment.id)}
              >
                <strong>{attachment.originalName}</strong>
                <span>
                  {formatSize(attachment.size)} ·{" "}
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  }).format(new Date(attachment.createdAt))}
                </span>
              </button>
              <button
                className="pdf-open"
                onClick={() => setReaderId(attachment.id)}
                aria-label="PDF'yi uygulamada aç"
              >
                Oku
              </button>
              <button
                className="plain-icon"
                onClick={() => openExternal(attachment)}
                aria-label="PDF'yi Windows'ta aç"
              >
                <Icon name="external" size={15} />
              </button>
              <button
                className="plain-icon"
                onClick={() => remove(attachment)}
                aria-label="PDF'yi sil"
              >
                <Icon name="trash" size={15} />
              </button>
            </article>
          ))}
        </div>
      )}

      {readerId &&
        attachments.find((attachment) => attachment.id === readerId) && (
          <Suspense
            fallback={
              <div className="pdf-reader-backdrop">
                <div className="pdf-loading">PDF okuyucu hazırlanıyor…</div>
              </div>
            }
          >
            <PdfReader
              key={readerId}
              attachment={
                attachments.find((attachment) => attachment.id === readerId)!
              }
              onChange={updateAttachment}
              onClose={() => setReaderId(null)}
            />
          </Suspense>
        )}
    </section>
  );
}
