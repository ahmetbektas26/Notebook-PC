import { useState } from "react";
import type { AppData, SecurityStatus } from "../types";
import Icon from "./Icon";

interface LockScreenProps {
  onUnlock: (data: AppData, status: SecurityStatus) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (!passcode) return;
    try {
      setBusy(true);
      setError("");
      const result = await window.notebookAPI?.unlock(passcode);
      if (!result) throw new Error("Masaüstü güvenlik servisine ulaşılamadı.");
      onUnlock(result.data, result.status);
    } catch {
      setError("Şifre yanlış. Lütfen yeniden dene.");
      setPasscode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="brand-mark large">
          <span />
          <span />
          <span />
        </div>
        <div className="lock-icon">
          <Icon name="lock" size={28} />
        </div>
        <span className="eyebrow">YEREL KASA KİLİTLİ</span>
        <h1>Notebook-PC’ye yeniden hoş geldin</h1>
        <p>
          Notların, PDF’lerin ve ses kayıtların bu cihazda şifreli tutuluyor.
        </p>
        <form onSubmit={unlock}>
          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="Uygulama şifren"
            autoFocus
          />
          {error && <span className="inline-error">{error}</span>}
          <button className="primary-button wide" type="submit" disabled={busy}>
            <Icon name="unlock" size={17} />
            {busy ? "Açılıyor…" : "Kasayı aç"}
          </button>
        </form>
        <small>
          Şifre cihazdan veya sunucudan kurtarılamaz. Yedek şifreni güvenli bir
          yerde sakla.
        </small>
      </div>
    </div>
  );
}
