"use client";

import { useState } from "react";

type TargetType = "CREATOR" | "GROUP";

export default function RobloxConnectionScreen({
  initialTargetType,
  initialTargetId,
}: {
  initialTargetType: TargetType;
  initialTargetId: string;
}) {
  const [targetType, setTargetType] = useState<TargetType>(initialTargetType);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [apiKey, setApiKey] = useState("");
  const [saveConfig, setSaveConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!targetId.trim() || !apiKey.trim()) {
      setMessage("Isi ID Roblox dan API Key terlebih dahulu.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/roblox/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          targetType === "CREATOR"
            ? { targetType, robloxUserId: targetId.trim(), apiKey: apiKey.trim() }
            : { targetType, robloxGroupId: targetId.trim(), apiKey: apiKey.trim() }
        ),
      });
      const data = await response.json().catch(() => ({}));
      setMessage(response.ok ? "Konfigurasi berhasil disimpan." : data.error ?? "Konfigurasi tidak valid.");
      if (response.ok) setApiKey("");
    } catch {
      setMessage("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mobile-content connection-screen">
      <div className="segmented-tabs">
        <button type="button" className={targetType === "CREATOR" ? "active" : ""} onClick={() => setTargetType("CREATOR")}>
          <span>♙</span> Akun Saya
        </button>
        <button type="button" className={targetType === "GROUP" ? "active" : ""} onClick={() => setTargetType("GROUP")}>
          <span>♧</span> Group / Community
        </button>
      </div>

      <section className="connection-info-card">
        <p className="section-kicker">Informasi Akun</p>
        <label className="field-label" htmlFor="roblox-user-id">
          {targetType === "CREATOR" ? "Roblox User ID" : "Roblox Group ID"}
        </label>
        <div className="input-with-icon">
          <span>♙</span>
          <input
            id="roblox-user-id"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            placeholder={targetType === "CREATOR" ? "Masukkan Roblox User ID" : "Masukkan Roblox Group ID"}
            inputMode="numeric"
          />
        </div>
        <p className="field-label mt-3">Creator API Key</p>
        <div className="input-with-icon">
          <span>⌕</span>
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            type="password"
            placeholder="Masukkan Creator API Key"
            autoComplete="new-password"
          />
          <span className="text-slate-400">◉</span>
        </div>

        <div className="setting-row mt-4">
          <div>
            <p className="text-[10px] font-medium text-white">Simpan konfigurasi</p>
            <p className="text-[8px] text-slate-500">Agar tidak perlu mengisi ulang.</p>
          </div>
          <button type="button" className={`switch ${saveConfig ? "on" : ""}`} onClick={() => setSaveConfig(!saveConfig)}>
            <span />
          </button>
        </div>
      </section>

      <button type="button" className="primary-button mt-3 w-full" disabled={saving || !saveConfig} onClick={handleSave}>
        {saving ? "Menyimpan..." : "▣  Simpan"}
      </button>
      {message && <p className="mt-2 text-center text-[10px] text-blue-300">{message}</p>}

      <div className="tip-card mt-3">
        <span className="tip-icon">◆</span>
        <p>Pastikan API Key kamu sudah benar dan memiliki permission untuk upload audio.</p>
      </div>
    </main>
  );
}