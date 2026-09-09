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
      className="secondary-button w-full text-center"
    >
      {loading ? "..." : "Disconnect"}
    </button>
  );
}
