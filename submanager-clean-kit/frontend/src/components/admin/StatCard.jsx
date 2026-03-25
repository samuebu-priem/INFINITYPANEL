export default function StatCard({ label, value, help }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-slate-400 text-sm">{label}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
      {help ? <p className="text-slate-500 text-sm mt-2">{help}</p> : null}
    </div>
  );
}
