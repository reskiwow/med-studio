"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "select" | "settings" | "target" | "config" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Pilih Audio" },
  { key: "settings", label: "Pengaturan" },
  { key: "target", label: "Tujuan" },
  { key: "config", label: "Konfigurasi" },
  { key: "review", label: "Proses" },
];

const DEFAULT_PRESET = { speed: 2.3, amplifyDb: -4, maxDurationSecs: 350 };

function describeRobloxResult(status: string | undefined) {
  switch (status) {
    case "SUCCESS":
      return "Upload berhasil.";
    case "REJECTED":
      return "Roblox menolak audio ini.";
    case "FAILED":
      return "Upload gagal.";
    case "PENDING":
    default:
      return "Masih diproses. Memantau status dari Roblox...";
  }
}

export default function UploadPage() {
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_PRESET);
  const [targetType, setTargetType] = useState<"CREATOR" | "GROUP">("CREATOR");
  const [targetId, setTargetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saveConfig, setSaveConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  async function handleSubmit() {
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    try {
      if (saveConfig) {
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
          const connData = await connRes.json().catch(() => ({}));
          setResult({ ok: false, message: connData.error ?? "Konfigurasi Roblox tidak valid. Periksa ID dan API key." });
          setSubmitting(false);
          return;
        }
      }

      const form = new FormData();
      form.append("file", file);
      form.append("settings", JSON.stringify(settings));

      const res = await fetch("/api/jobs", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Gagal memproses." });
      } else {
        const status = data.robloxResult;
        setResult({ ok: status !== "FAILED" && status !== "REJECTED", message: describeRobloxResult(status) });
        if (data.job?.id && status === "PENDING") {
          pollJobStatus(data.job.id);
        }
      }
    } catch {
      setResult({ ok: false, message: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  }

  async function pollJobStatus(jobId: string, attempt = 0) {
    if (attempt > 10) return; // stop after ~50s of polling; user can check History later
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      const status = data.job?.robloxResult;
      setResult({ ok: status !== "FAILED" && status !== "REJECTED", message: describeRobloxResult(status) });
      if (status === "PENDING") {
        pollJobStatus(jobId, attempt + 1);
      }
    } catch {
      // network hiccup while polling; leave last known status showing
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold">Upload Audio</h1>

      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-gradient-to-r from-neon-blue to-neon-purple" : "bg-white/10"}`}
          />
        ))}
      </div>

      {step === "select" && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-sm text-slate-300">Pilih file audio (MP3, WAV, atau OGG, maks 20MB).</p>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-slate-200"
          />
          {file && <p className="text-xs text-slate-500">Terpilih: {file.name}</p>}
          <NextButton disabled={!file} onClick={() => setStep("settings")} />
        </div>
      )}

      {step === "settings" && (
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Gunakan preset default</p>
            <Toggle checked={!useCustom} onChange={(v) => setUseCustom(!v)} />
          </div>
          <p className="text-xs text-slate-500">
            Preset: Speed {DEFAULT_PRESET.speed}x · Amplify {DEFAULT_PRESET.amplifyDb}dB · Max{" "}
            {DEFAULT_PRESET.maxDurationSecs}s
          </p>

          {useCustom && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <NumberField label="Speed (x)" value={settings.speed} step={0.1} onChange={(v) => setSettings((s) => ({ ...s, speed: v }))} />
              <NumberField label="Amplify (dB)" value={settings.amplifyDb} step={0.5} onChange={(v) => setSettings((s) => ({ ...s, amplifyDb: v }))} />
              <NumberField label="Max Duration (s)" value={settings.maxDurationSecs} step={10} onChange={(v) => setSettings((s) => ({ ...s, maxDurationSecs: v }))} />
            </div>
          )}

          <div className="flex gap-2">
            <BackButton onClick={() => setStep("select")} />
            <NextButton onClick={() => { if (!useCustom) setSettings(DEFAULT_PRESET); setStep("target"); }} />
          </div>
        </div>
      )}

      {step === "target" && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-sm text-slate-300">Publikasikan sebagai:</p>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceCard label="Creator / My Account" active={targetType === "CREATOR"} onClick={() => setTargetType("CREATOR")} />
            <ChoiceCard label="Group / Community" active={targetType === "GROUP"} onClick={() => setTargetType("GROUP")} />
          </div>
          <div className="flex gap-2">
            <BackButton onClick={() => setStep("settings")} />
            <NextButton onClick={() => setStep("config")} />
          </div>
        </div>
      )}

      {step === "config" && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <Link href="/tutorial" className="text-xs text-neon-blue underline underline-offset-2">
            Belum punya ID/API Key? Lihat cara bikinnya
          </Link>
          <TextField
            label={targetType === "CREATOR" ? "Roblox Creator/User ID" : "Roblox Group/Community ID"}
            value={targetId}
            onChange={setTargetId}
            placeholder="Contoh: 123456789"
          />
          <TextField
            label="API Credential"
            value={apiKey}
            onChange={setApiKey}
            placeholder="Open Cloud API key"
            type="password"
          />
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">Simpan konfigurasi ini</p>
            <Toggle checked={saveConfig} onChange={setSaveConfig} />
          </div>
          <div className="flex gap-2">
            <BackButton onClick={() => setStep("target")} />
            <NextButton disabled={!targetId || !apiKey} onClick={() => setStep("review")} />
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="glass rounded-2xl p-4 space-y-4">
          <p className="text-sm text-slate-300">Ringkasan</p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>File: {file?.name}</li>
            <li>Speed: {settings.speed}x · Amplify: {settings.amplifyDb}dB · Max: {settings.maxDurationSecs}s</li>
            <li>Tujuan: {targetType === "CREATOR" ? "Creator / My Account" : "Group / Community"} ({targetId})</li>
          </ul>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple py-3 font-medium text-white shadow-glow disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Proses & Publikasikan"}
          </button>

          {result && (
            <p className={`text-sm ${result.ok ? "text-emerald-400" : "text-rose-400"}`}>{result.message}</p>
          )}
          <p className="text-[11px] text-slate-500">
            Status akhir (Success/Processing/Rejected/Failed) akan mengikuti respons asli dari Roblox dan bisa dilihat di halaman History.
          </p>
        </div>
      )}
    </div>
  );
}

function NextButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white disabled:opacity-40"
    >
      Lanjut
    </button>
  );
}
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-300">
      Kembali
    </button>
  );
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full transition-colors ${checked ? "bg-neon-violet" : "bg-white/15"}`}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
function NumberField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
function TextField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
function ChoiceCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-3 text-left text-sm ${active ? "bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 glow-border" : "bg-white/5 border border-white/10 text-slate-300"}`}
    >
      {label}
    </button>
  );
}
