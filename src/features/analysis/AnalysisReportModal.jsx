import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReportSection from './ReportSection';
import DataList from './DataList';
import MermaidDiagram from './MermaidDiagram';
import MarkdownContent from './MarkdownContent';

function normalizeList(value) {
  if (Array.isArray(value)) return value;

  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Fall back to splitting ordinary text.
    }
  }

  return trimmed
    .split(/\r?\n|,/)
    .map((item) => item.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

export default function AnalysisReportModal({ report, onClose }) {
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (!summaryOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSummaryOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [summaryOpen]);

  if (!report) return null;

  const repository = report.repositoryInfo || report.repository || {};

  const reportTitle =
    repository.name ||
    report.repositoryName ||
    repository.fullName ||
    `Analysis report #${report.id ?? ''}`;

  const technologies = normalizeList(report.technologies);
  const allImportantFiles = normalizeList(report.importantFiles);
  const importantFiles = allImportantFiles.slice(0, 10);
  const sampleFiles = normalizeList(report.sampleFilePaths).slice(0, 8);
  const createdAt = report.createdAt || report.created_at;
  const summaryUsesFallback = report.aiSummary
    ?.includes('AI-generated summary is unavailable');
  const diagramUsesFallback = report.architectureDiagram
    ?.includes('AI architecture generation unavailable');
  const summaryPreviewLimit = 560;
  const summaryPreview = report.aiSummary?.length > summaryPreviewLimit
    ? `${report.aiSummary.slice(0, summaryPreviewLimit).trimEnd()}...`
    : report.aiSummary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="my-auto w-full max-w-5xl rounded-2xl border border-slate-700 bg-[#0b1120] p-5 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-sm text-emerald-300">
              RepoInsight / Analysis
            </p>

            <h2
              id="report-dialog-title"
              className="break-words text-2xl font-bold text-slate-100"
            >
              {reportTitle}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Report #{report.id ?? 'N/A'}
              {createdAt
                ? ` · ${new Date(createdAt).toLocaleString()}`
                : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close report"
            className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#111b2e] p-4">
            <p className="text-sm text-slate-400">Analysis status</p>
            <p className="mt-2 text-lg font-semibold text-emerald-300">
              {report.status || 'Available'}
            </p>
            {(summaryUsesFallback || diagramUsesFallback) && (
              <p className="mt-2 text-xs leading-5 text-amber-300">
                AI generation was unavailable for part of this report. The
                displayed fallback uses GitHub repository metadata.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111b2e] p-4">
            <p className="text-sm text-slate-400">Files discovered</p>
            <p className="mt-2 text-lg font-semibold">
              {report.fileCount ?? 'N/A'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111b2e] p-4">
            <p className="text-sm text-slate-400">Repository language</p>
            <p className="mt-2 text-lg font-semibold">
              {repository.language || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <ReportSection title={summaryUsesFallback ? 'Repository evidence summary' : 'AI-generated summary'}>
            {report.aiSummary ? (
              <>
                <div className="max-h-56 overflow-hidden break-words [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
                  <MarkdownContent content={summaryPreview} />
                </div>
                <button
                  type="button"
                  onClick={() => setSummaryOpen(true)}
                  className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  View full summary
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No AI summary is available in this report.
              </p>
            )}
          </ReportSection>

          <ReportSection title="Technology stack">
            {technologies.length ? (
              <div className="flex flex-wrap gap-2">
                {technologies.map((technology, index) => (
                  <span
                    key={`${technology}-${index}`}
                    className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No technologies were detected.
              </p>
            )}
          </ReportSection>

          <ReportSection title="Architecture diagram">
            <MermaidDiagram
              chart={report.architectureDiagram}
              technologies={technologies}
              importantFiles={importantFiles}
            />
          </ReportSection>

          <ReportSection title={`Important files${allImportantFiles.length > 10 ? ' (showing 10)' : ''}`}>
            <DataList items={importantFiles} />
          </ReportSection>

          <ReportSection title="Sample file paths">
            <DataList items={sampleFiles} />

            {report.treeTruncated && (
              <p className="mt-3 text-sm text-amber-300">
                The repository file tree was truncated, so this analysis may
                not include every file.
              </p>
            )}
          </ReportSection>

          {report.readmeContent && (
            <ReportSection title="Repository README">
              <details>
                <summary className="cursor-pointer text-sm text-emerald-300">
                  Read the fetched README
                </summary>

                <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                  {report.readmeContent}
                </pre>
              </details>
            </ReportSection>
          )}
        </div>
      </section>

      {summaryOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 sm:p-6"
          onClick={() => setSummaryOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-dialog-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1120] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                  {summaryUsesFallback ? 'Repository evidence' : 'AI analysis'}
                </p>
                <h2
                  id="summary-dialog-title"
                  className="mt-1 text-xl font-semibold text-slate-100"
                >
                  {reportTitle} summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                aria-label="Close summary"
                className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <X size={20} />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {summaryUsesFallback && (
                <p className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
                  AI generation was unavailable. This summary contains
                  repository evidence and metadata instead.
                </p>
              )}
              <div className="break-words">
                <MarkdownContent content={report.aiSummary} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
