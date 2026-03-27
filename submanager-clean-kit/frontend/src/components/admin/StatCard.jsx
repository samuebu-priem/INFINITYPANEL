export default function StatCard({ label, value, help }) {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {help ? <p className="mt-2 text-sm text-slate-500">{help}</p> : null}
    </div>
  );
}
