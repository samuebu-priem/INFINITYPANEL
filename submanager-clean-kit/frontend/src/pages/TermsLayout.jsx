export default function TermsLayout({ title, updatedAt, sections }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-[2rem] border border-[#1f2937] bg-[#121821] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-8 border-b border-[#1f2937] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-400">
            SubManager
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#f3f4f6] sm:text-4xl">{title}</h1>
          {updatedAt ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#1f2937] bg-[#0f141c] px-4 py-2 text-sm text-[#cbd5e1]">
              <span className="text-indigo-400">●</span>
              Atualizado em {updatedAt}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-[#1f2937] bg-[#0f141c] p-5"
            >
              <h2 className="text-lg font-semibold text-[#f3f4f6]">{section.title}</h2>
              <p className="mt-3 leading-7 text-[#cbd5e1]">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}