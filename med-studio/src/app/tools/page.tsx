"use client";

import { useState } from "react";
import Link from "next/link";
import { saveAudioPreset, loadAudioPreset } from "@/lib/audioPreset";

export default function ToolsPage() {
  const [mode, setMode] = useState<"PRESET" | "CUSTOM">("PRESET");
  const [speed, setSpeed] = useState(2.3);
  const [amplify, setAmplify] = useState(-4);
  const [duration, setDuration] = useState(350);
  const [saved, setSaved] = useState(false);

  function handleSavePreset() {
    saveAudioPreset({ speed, amplifyDb: amplify, maxDurationSecs: duration });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mobile-page">
      <header className="app-topbar page-titlebar">
        <Link href="/" className="back-button" aria-label="Kembali">‹</Link>
        <h1>Audio Tools</h1>
        <span className="topbar-menu">⋮</span>
      </header>
      <main className="mobile-content tools-screen">
        <div className="segmented-tabs">
          <button type="button" className={mode === "PRESET" ? "active" : ""} onClick={() => setMode("PRESET")}>Preset</button>
          <button type="button" className={mode === "CUSTOM" ? "active" : ""} onClick={() => setMode("CUSTOM")}>Custom</button>
        </div>

        <div className="preset-header mt-3">
          <p className="section-kicker">Preset Default</p>
          <span className="mini-toggle selected">↗ Gunakan</span>
        </div>
        <div className="preset-grid">
          <Preset label="Speed" value={speed} suffix="x" onChange={setSpeed} />
          <Preset label="Amplify" value={amplify} suffix="dB" onChange={setAmplify} />
          <Preset label="Max Duration" value={duration} suffix="s" onChange={setDuration} />
        </div>

        <section className="tool-card mt-3">
          <p className="section-kicker">Custom Settings</p>
          <Slider label="Speed" value={speed} min={1} max={4} suffix="x" onChange={setSpeed} />
          <Slider label="Amplify" value={amplify} min={-12} max={12} suffix="dB" onChange={setAmplify} />
          <Slider label="Max Duration" value={duration} min={10} max={600} suffix="s" onChange={setDuration} />
        </section>

        <button type="button" className="primary-button mt-3 w-full" onClick={handleSavePreset}>
          ▣ &nbsp; {saved ? "Tersimpan!" : "Simpan Preset"}
        </button>
        <Link href="/upload" onClick={handleSavePreset} className="secondary-button mt-2 block text-center">
          Gunakan untuk Upload
        </Link>
      </main>
    </div>
  );
}

function Preset({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="preset-card">
      <span className="text-[8px] text-slate-400">{label}</span>
      <span className="mt-1 text-[11px] font-bold text-white">{value}{suffix}</span>
      <input type="range" min={label === "Speed" ? 1 : label === "Amplify" ? -12 : 10} max={label === "Speed" ? 4 : label === "Amplify" ? 12 : 600} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Slider({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="tool-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={label === "Speed" ? 0.1 : 1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="value">{value}{suffix}</span>
    </label>
  );
}