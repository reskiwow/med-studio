"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DisconnectButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/roblox/connection", { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50"
    >
      {loading ? "..." : "Disconnect"}
    </button>
  );
}
