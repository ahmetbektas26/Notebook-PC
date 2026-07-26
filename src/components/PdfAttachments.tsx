import { useRef, useState } from "react";
import type { PdfAttachment } from "../types";
import { uid } from "../lib/data";
import Icon from "./Icon";

interface PdfAttachmentsProps {
  attachments: PdfAttachment[];
  onChange: (attachments: PdfAttachment[]) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfAttachments({
  attachments,
  onChange
}: PdfAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addFiles(files: FileList | File[]) {
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
          createdAt: new Date().toISOString()
        });
      }
      onChange([...attachments, ...created]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "PDF dosyası kaydedilemedi."
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function open(attachment: PdfAttachment) {
    try {
      setError("");
      await window.notebookAPI?.openAttachment(attachment.fileName);
    } catch {
      setError("PDF açılamadı. Dosya taşınmış veya silinmiş olabilir.");
    }
  }

  async function remove(attachment: PdfAttachment) {
    await window.notebookAPI?.deleteAttachment(attachment.fileName);
    onChange(attachments.filter((item) => item.id !== attachment.id));
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
              <button className="pdf-name" onClick={() => open(attachment)}>
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
                onClick={() => open(attachment)}
                aria-label="PDF'yi aç"
              >
                Aç
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
    </section>
  );
}
