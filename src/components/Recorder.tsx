import { useEffect, useRef, useState } from "react";
import type { AudioNote } from "../types";
import { uid } from "../lib/data";
import Icon from "./Icon";

interface RecorderProps {
  recordings: AudioNote[];
  onChange: (recordings: AudioNote[]) => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export default function Recorder({ recordings, onChange }: RecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(
      () => setElapsed((Date.now() - startedAtRef.current) / 1000),
      250
    );
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(audioUrls)
        .filter((url) => url.startsWith("blob:"))
        .forEach(URL.revokeObjectURL);
    },
    [audioUrls]
  );

  async function start() {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(
        stream,
        preferred ? { mimeType: preferred } : undefined
      );
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const duration = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        const bytes = await blob.arrayBuffer();
        let fileName = `browser-${uid()}.webm`;
        if (window.notebookAPI) {
          fileName = await window.notebookAPI.saveAudio(bytes, blob.type);
        } else {
          setAudioUrls((current) => ({
            ...current,
            [fileName]: URL.createObjectURL(blob)
          }));
        }
        onChange([
          ...recordings,
          {
            id: uid(),
            fileName,
            duration,
            createdAt: new Date().toISOString()
          }
        ]);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Mikrofon izni verilemedi. Sistem ayarlarından izni kontrol et.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function play(audio: AudioNote) {
    if (audioUrls[audio.fileName]) return;
    if (!window.notebookAPI) return;
    try {
      const url = await window.notebookAPI.readAudio(audio.fileName);
      setAudioUrls((current) => ({ ...current, [audio.fileName]: url }));
    } catch {
      setError("Ses kaydı açılamadı.");
    }
  }

  async function remove(audio: AudioNote) {
    if (window.notebookAPI) await window.notebookAPI.deleteAudio(audio.fileName);
    onChange(recordings.filter((item) => item.id !== audio.id));
  }

  return (
    <section className="recorder-panel">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">SESLİ NOTLAR</span>
          <p>Dersi anlatırken veya tekrar ederken kaydet.</p>
        </div>
        <button
          className={`record-button ${recording ? "recording" : ""}`}
          onClick={recording ? stop : start}
        >
          <Icon name={recording ? "stop" : "mic"} size={17} />
          {recording ? `Kaydı bitir · ${formatDuration(elapsed)}` : "Ses kaydı ekle"}
        </button>
      </div>
      {error && <p className="inline-error">{error}</p>}
      {recordings.length === 0 ? (
        <div className="empty-audio">
          <div className="wave-bars">
            {[8, 14, 22, 12, 18, 9, 16, 7].map((height, index) => (
              <span key={index} style={{ height }} />
            ))}
          </div>
          Henüz ses kaydı yok
        </div>
      ) : (
        <div className="audio-list">
          {recordings.map((audio, index) => (
            <div className="audio-row" key={audio.id}>
              <button
                className="audio-play"
                onClick={() => play(audio)}
                aria-label="Kaydı yükle"
              >
                <Icon name="play" size={15} />
              </button>
              <div className="audio-info">
                <strong>Sesli not {index + 1}</strong>
                <span>
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  }).format(new Date(audio.createdAt))}
                </span>
              </div>
              <span>{formatDuration(audio.duration)}</span>
              <button
                className="plain-icon"
                onClick={() => remove(audio)}
                aria-label="Ses kaydını sil"
              >
                <Icon name="trash" size={15} />
              </button>
              {audioUrls[audio.fileName] && (
                <audio
                  className="native-audio"
                  controls
                  autoPlay
                  src={audioUrls[audio.fileName]}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
