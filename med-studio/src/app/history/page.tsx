import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

const FILTERS = ["All", "Success", "Processing", "Rejected", "Failed"] as const;

export default async function HistoryPage({ searchParams }: { searchParams: { filter?: string } }) {
  const user = await getSessionUser();
  if (!user) return <p className="pt-20 text-center text-slate-400">Silakan login.</p>;

  const filter = (searchParams.filter ?? "All") as (typeof FILTERS)[number];
  const resultMap: Record<string, string | undefined> = {
    Success: "SUCCESS",
    Processing: "PROCESSING",
    Rejected: "REJECTED",
    Failed: "FAILED",
  };

  const items = await db.uploadHistory.findMany({
    where: {
      userId: user.id,
      ...(filter !== "All" ? { robloxResult: resultMap[filter] as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { job: { select: { robloxAssetId: true } } },
  });

  return (
    <div className="mobile-page">
      <header className="app-topbar page-titlebar">
        <Link href="/" className="back-button" aria-label="Kembali">‹</Link>
        <h1>Hasil Upload</h1>
        <span className="topbar-menu">⋮</span>
      </header>
      <main className="mobile-content space-y-3">

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <a
            key={f}
            href={`/history?filter=${f}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] ${
              filter === f ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white" : "glass text-slate-300"
            }`}
          >
            {f}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><span>◷</span><p>Tidak ada riwayat untuk filter ini.</p></div>
      ) : (
        <ul className="space-y-3">
          {items.map((h) => {
            const isSuccess = h.robloxResult === "SUCCESS";
            const isPending = h.robloxResult === "PROCESSING" || h.robloxResult === "PENDING";
            const statusClass = isSuccess ? "history-success" : isPending ? "history-pending" : "history-error";
            const statusIcon = isSuccess ? "✓" : isPending ? "◷" : "!";
            const statusTitle = isSuccess
              ? "Upload Berhasil!"
              : isPending
              ? "Masih Diproses"
              : h.robloxResult === "REJECTED"
              ? "Ditolak Roblox"
              : "Upload Gagal";
            const statusDesc = isSuccess
              ? "Audio kamu telah diupload dan lolos moderasi Roblox."
              : isPending
              ? "Audio kamu sedang menunggu hasil moderasi dari Roblox."
              : h.robloxResult === "REJECTED"
              ? "Roblox menolak audio ini saat moderasi."
              : h.errorMessage ?? "Upload tidak berhasil diselesaikan.";

            return (
              <li key={h.id} className="history-card">
                <div className={statusClass}>
                  <span>{statusIcon}</span>
                  <div>
                    <p className="text-[10px] font-semibold">{statusTitle}</p>
                    <p className="text-[8px] text-slate-400">{statusDesc}</p>
                  </div>
                </div>
                <div className="history-detail"><span>Judul File</span><strong>{h.filename}</strong></div>
                <div className="history-detail"><span>ID Roblox Audio</span><strong>{h.job.robloxAssetId ?? "-"}</strong></div>
                <div className="history-detail"><span>Durasi</span><strong>{h.duration ? `${Math.round(h.duration)}s` : "-"}</strong></div>
                <div className="history-upload-log"><span>{isSuccess ? "✓" : isPending ? "◷" : "!"}</span> Upload ke Roblox <b>{resultLabel(h.robloxResult, h.errorMessage)}</b></div>
                {isSuccess && (
                  <Link href="https://www.roblox.com" className="secondary-button mt-3 block text-center text-[9px]">↗ &nbsp; Lihat di Roblox</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      </main>
    </div>
  );
}

function resultLabel(status: string, errorMessage: string | null) {
  switch (status) {
    case "SUCCESS":
      return <span className="text-emerald-400">Upload berhasil.</span>;
    case "PROCESSING":
    case "PENDING":
      return <span className="text-amber-400">Masih diproses.</span>;
    case "REJECTED":
      return <span className="text-rose-400">Roblox menolak audio ini.</span>;
    case "FAILED":
      return <span className="text-rose-400">Upload gagal.{errorMessage ? ` (${errorMessage})` : ""}</span>;
    default:
      return <span className="text-slate-400">{status}</span>;
  }
}
