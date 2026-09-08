export default function DashboardCard({
  label,
  value,
  sub,
  accent = "blue",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "purple" | "neutral";
}) {
  const accentClass =
    accent === "blue" ? "text-neon-blue" : accent === "purple" ? "text-neon-purple" : "text-slate-300";

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-display font-semibold ${accentClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
