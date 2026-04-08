import { CalendarDays } from "lucide-react";

export default function TermsLayout({ title, updatedAt, sections }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">Infinity Painel</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300">
            <CalendarDays className="h-4 w-4 text-sky-400" />
            Atualizado em {updatedAt}
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}