import { useRef, useState } from "react";
import type { AppData, SecurityStatus } from "../types";
import Icon from "./Icon";

interface LockScreenProps {
  onUnlock: (data: AppData, status: SecurityStatus) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [passcodeLength, setPasscodeLength] = useState(0);
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    const passcode = inputRef.current?.value ?? "";
    if (!passcode) {
      setError("Devam etmek için şifreni yaz.");
      inputRef.current?.focus();
      return;
    }
    try {
      setBusy(true);
      setError("");
      const result = await window.notebookAPI?.unlock(passcode);
      if (!result) throw new Error("Masaüstü güvenlik servisine ulaşılamadı.");
      onUnlock(result.data, result.status);
    } catch {
      setError("Şifre yanlış. Lütfen yeniden dene.");
      if (inputRef.current) inputRef.current.value = "";
      setPasscodeLength(0);
      requestAnimationFrame(() => inputRef.current?.focus());
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
        <form onSubmit={unlock} noValidate>
          <div className="lock-input-wrap">
            <input
              ref={inputRef}
              type={showPasscode ? "text" : "password"}
              name="passcode"
              onInput={(event) => {
                setPasscodeLength(event.currentTarget.value.length);
                if (error) setError("");
              }}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Uygulama şifren"
              aria-label="Uygulama şifresi"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "unlock-error" : "unlock-hint"}
              autoComplete="current-password"
              enterKeyHint="go"
              maxLength={128}
              disabled={busy}
              autoFocus
            />
            <button
              type="button"
              className="password-visibility"
              aria-label={showPasscode ? "Şifreyi gizle" : "Şifreyi göster"}
              aria-pressed={showPasscode}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowPasscode((current) => !current)}
            >
              {showPasscode ? "Gizle" : "Göster"}
            </button>
          </div>
          <div className="lock-input-status">
            <span id="unlock-hint">
              {passcodeLength
                ? `${passcodeLength} karakter yazıldı`
                : "Şifreni klavyeyle yazabilir veya yapıştırabilirsin."}
            </span>
          </div>
          {error && (
            <span className="inline-error" id="unlock-error" role="alert">
              {error}
            </span>
          )}
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
