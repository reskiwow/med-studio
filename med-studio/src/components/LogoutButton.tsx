"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 disabled:opacity-50"
    >
      {loading ? "..." : "Logout"}
    </button>
  );
}
