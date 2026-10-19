export default function ReportSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#111b2e] p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        {title}
      </h3>
      {children}
    </section>
  );
}
