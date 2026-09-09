"use client";

export type AudioPreset = {
  speed: number;
  amplifyDb: number;
  maxDurationSecs: number;
};

const STORAGE_KEY = "med_studio_audio_preset";

export function saveAudioPreset(preset: AudioPreset) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
  } catch {
    // localStorage unavailable (private mode, etc.) — fail silently, preset just won't persist
  }
}

export function loadAudioPreset(): AudioPreset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.speed === "number" &&
      typeof parsed.amplifyDb === "number" &&
      typeof parsed.maxDurationSecs === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
