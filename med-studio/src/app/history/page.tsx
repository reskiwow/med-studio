import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";

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
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Riwayat</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <a
            key={f}
            href={`/history?filter=${f}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
              filter === f ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white" : "glass text-slate-300"
            }`}
          >
            {f}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 pt-6 text-center">Tidak ada riwayat untuk filter ini.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => (
            <li key={h.id} className="glass rounded-xl p-3 text-sm">
              <div className="flex justify-between items-start">
                <p className="font-medium truncate max-w-[65%]">{h.filename}</p>
                <span className="text-[11px] text-slate-400">{new Date(h.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {h.destination === "CREATOR" ? "Creator" : "Group"} · {h.duration ? `${Math.round(h.duration)}s` : "-"}
              </p>
              <p className="text-xs mt-1">{resultLabel(h.robloxResult, h.errorMessage)}</p>
            </li>
          ))}
        </ul>
      )}
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
