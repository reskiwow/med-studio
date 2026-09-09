"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadAudioPreset } from "@/lib/audioPreset";

const DEFAULT_PRESET = { speed: 2.3, amplifyDb: -4, maxDurationSecs: 350 };

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetType, setTargetType] = useState<"CREATOR" | "GROUP">("CREATOR");
  const [targetId, setTargetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_PRESET);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; pending?: boolean; message: string } | null>(null);

  // Pick up a preset saved from the Tools page, if any. Previously Tools
  // and Upload were completely disconnected -- configuring a custom preset
  // there had no effect here at all.
  useEffect(() => {
    const saved = loadAudioPreset();
    if (saved) {
      setSettings(saved);
      setUseCustom(true);
    }
  }, []);

  const activeSettings = useCustom ? settings : DEFAULT_PRESET;

  async function handleSubmit() {
    if (!file || !targetId || !apiKey) {
      setResult({ ok: false, message: "Lengkapi file, ID Roblox, dan API Key." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const connRes = await fetch("/api/roblox/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          targetType === "CREATOR"
            ? { targetType, robloxUserId: targetId, apiKey }
            : { targetType, robloxGroupId: targetId, apiKey }
        ),
      });
      if (!connRes.ok) {
        const data = await connRes.json().catch(() => ({}));
        setResult({ ok: false, message: data.error ?? "Konfigurasi Roblox tidak valid." });
        return;
      }

      const form = new FormData();
      form.append("file", file);
      form.append("settings", JSON.stringify(activeSettings));
      const response = await fetch("/api/jobs", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setResult({ ok: false, message: data.error ?? "Upload gagal." });
        return;
      }
      const pending = data.robloxResult === "PENDING" || data.robloxResult === "PROCESSING";
      setResult({ ok: true, pending, message: pending ? "Audio sedang diproses..." : "Upload berhasil." });
    } catch {
      setResult({ ok: false, message: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  }

  const idLabel = targetType === "CREATOR" ? "Roblox User ID" : "Roblox Group ID";
  const idPlaceholder = targetType === "CREATOR" ? "Masukkan Roblox User ID" : "Masukkan Roblox Group ID";
  const keyLabel = targetType === "CREATOR" ? "Creator API Key" : "Group API Key";

  return (
    <div className="mobile-page">
      <header className="app-topbar page-titlebar">
        <Link href="/" className="back-button" aria-label="Kembali">‹</Link>
        <h1>Upload Audio</h1>
        <span className="topbar-menu">⋮</span>
      </header>

      <main className="mobile-content upload-screen">
        <label className="upload-dropzone">
          <span className="upload-cloud">♧</span>
          <span className="text-[10px] font-semibold text-white">Pilih atau drag &amp; drop file audio</span>
          <span className="text-[8px] text-slate-500">Format: MP3, WAV, M4A, OGG · Max 20MB</span>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/x-m4a"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        {file && (
          <div className="file-row">
            <span className="file-icon">♫</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-white">{file.name}</p>
              <p className="text-[8px] text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button type="button" onClick={() => setFile(null)} className="text-xs text-slate-400">×</button>
          </div>
        )}

        <p className="section-kicker mt-3">Upload sebagai</p>
        <div className="segmented-tabs compact">
          <button type="button" className={targetType === "CREATOR" ? "active" : ""} onClick={() => setTargetType("CREATOR")}>♙ &nbsp;Akun Saya (Creator)</button>
          <button type="button" className={targetType === "GROUP" ? "active" : ""} onClick={() => setTargetType("GROUP")}>♧ &nbsp;Group / Community</button>
        </div>

        <label className="field-label mt-3" htmlFor="upload-roblox-id">{idLabel}</label>
        <div className="input-with-icon"><span>♙</span><input id="upload-roblox-id" value={targetId} onChange={(event) => setTargetId(event.target.value)} placeholder={idPlaceholder} /></div>
        <label className="field-label mt-3" htmlFor="upload-api-key">{keyLabel}</label>
        <div className="input-with-icon"><span>⌕</span><input id="upload-api-key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" placeholder={`Masukkan ${keyLabel}`} /></div>

        <div className="preset-header mt-3">
          <p className="section-kicker">{useCustom ? "Pengaturan Custom" : "Preset Default"}</p>
          <button type="button" className={`mini-toggle ${useCustom ? "selected" : ""}`} onClick={() => setUseCustom(!useCustom)}>↗ Custom</button>
        </div>
        <div className="preset-grid">
          <Preset label="Speed" value={activeSettings.speed} suffix="x" editable={useCustom} onChange={(value) => setSettings({ ...settings, speed: value })} />
          <Preset label="Amplify" value={activeSettings.amplifyDb} suffix="dB" editable={useCustom} onChange={(value) => setSettings({ ...settings, amplifyDb: value })} />
          <Preset label="Max Duration" value={activeSettings.maxDurationSecs} suffix="s" editable={useCustom} onChange={(value) => setSettings({ ...settings, maxDurationSecs: value })} />
        </div>
        {!useCustom && (
          <p className="text-[8px] text-slate-500 mt-1">Pakai preset default. Tap "Custom" buat atur sendiri.</p>
        )}

        <button type="button" className="primary-button mt-3 w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Memproses..." : "♧  Proses Audio"}
        </button>
        {result && (
          <div className={`result-card ${result.ok ? "success" : "error"}`}>
            <span>{result.ok ? (result.pending ? "◷" : "✓") : "!"}</span>
            <div><p className="font-semibold">{result.message}</p><p className="text-[8px] opacity-70">{result.ok ? "Cek History untuk detail status Roblox." : "Periksa kembali data yang dimasukkan."}</p></div>
          </div>
        )}
      </main>
    </div>
  );
}

function Preset({ label, value, suffix, editable, onChange }: { label: string; value: number; suffix: string; editable: boolean; onChange: (value: number) => void }) {
  return (
    <label className={`preset-card ${editable ? "" : "opacity-60"}`}>
      <span className="text-[8px] text-slate-400">{label}</span>
      <span className="mt-1 text-[11px] font-bold text-white">{value}{suffix}</span>
      <input
        type="range"
        disabled={!editable}
        min={label === "Speed" ? 1 : label === "Amplify" ? -12 : 10}
        max={label === "Speed" ? 4 : label === "Amplify" ? 12 : 600}
        step={label === "Speed" ? 0.1 : label === "Amplify" ? 1 : 5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
