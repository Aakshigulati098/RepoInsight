export default function StatCard({ icon, label, value, note, trend, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  };

  const activeColor = colorMap[color] || colorMap.emerald;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#131d31] to-[#0e1726] p-5 shadow-lg backdrop-blur transition-all duration-300 hover:border-slate-700 hover:shadow-emerald-500/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`rounded-xl border p-2.5 ${activeColor}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {note && (
        <p className="mt-2 text-xs text-slate-400">
          {note}
        </p>
      )}

      {/* Decorative gradient corner glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl" />
    </div>
  );
}
