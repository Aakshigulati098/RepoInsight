import { useState, useMemo } from 'react';
import {
  Trash2,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  FileCode2,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Eye,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function AnalysisReportsList({
  reports = [],
  loading,
  reportLoadingId,
  deletingReportId,
  onRefresh,
  onViewReport,
  onDeleteReport,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const repoName = (
          r.repositoryName ||
          r.repositoryInfo?.name ||
          r.repository?.name ||
          ''
        ).toLowerCase();
        const idStr = String(r.id ?? r.reportId ?? '');
        const summary = (r.aiSummary || '').toLowerCase();
        return repoName.includes(q) || idStr.includes(q) || summary.includes(q);
      });
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((r) => {
        const status = String(r.status || 'PENDING').toUpperCase();
        return status === statusFilter;
      });
    }

    return result;
  }, [reports, searchQuery, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  return (
    <section id="analysis" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-white">AI Analysis Reports</h3>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-slate-700">
              {reports.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Comprehensive architectural reviews, Mermaid topology diagrams, and tech stack detection.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by repository name or keywords..."
              className="w-full rounded-xl border border-slate-700/80 bg-[#090f1b] pl-9 pr-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-emerald-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'FAILED', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  statusFilter === tab.id
                    ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div>
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-10 text-center">
            <RefreshCw size={24} className="mx-auto animate-spin text-emerald-400" />
            <p className="mt-2 text-xs text-slate-400">Loading analysis reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-12 text-center">
            <Sparkles size={32} className="mx-auto text-slate-600" />
            <h4 className="mt-2 text-sm font-bold text-white">No analysis reports yet</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Analyze any repository from the Repositories tab to create an architectural audit.
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-8 text-center text-xs text-slate-400">
            No analysis reports matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report, index) => {
              const reportId = report.id ?? report.reportId ?? report.analysisId;
              const repositoryName =
                report.repositoryName ||
                report.repositoryInfo?.name ||
                report.repository?.name ||
                `Repository #${report.repositoryInfo?.id || report.repositoryId || index + 1}`;

              const status = String(report.status || 'PENDING').toUpperCase();
              const createdAt = report.createdAt ?? report.created_at ?? report.timestamp;

              // Parse technologies if stored as comma-separated or JSON
              let techList = [];
              if (typeof report.technologies === 'string') {
                try {
                  const parsed = JSON.parse(report.technologies);
                  if (Array.isArray(parsed)) techList = parsed;
                  else techList = report.technologies.split(',').map((t) => t.trim());
                } catch {
                  techList = report.technologies.split(',').map((t) => t.trim());
                }
              } else if (Array.isArray(report.technologies)) {
                techList = report.technologies;
              }

              return (
                <article
                  key={reportId ?? `report-${index}`}
                  className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-5 transition-all hover:border-slate-700 hover:shadow-lg sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                        #{reportId}
                      </span>

                      <h4 className="text-base font-bold text-white transition group-hover:text-emerald-300">
                        {repositoryName}
                      </h4>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          status === 'COMPLETED'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : status === 'FAILED'
                            ? 'border-red-500/30 bg-red-500/10 text-red-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse'
                        }`}
                      >
                        {status === 'COMPLETED' && <CheckCircle2 size={10} />}
                        {status === 'FAILED' && <AlertCircle size={10} />}
                        {status === 'IN_PROGRESS' || status === 'PENDING' ? <Clock3 size={10} /> : null}
                        {status}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {createdAt && (
                        <span>
                          {new Date(createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      {report.fileCount != null && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <FileCode2 size={13} className="text-slate-500" />
                          {report.fileCount} files scanned
                        </span>
                      )}

                      {report.architectureDiagram && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Layers size={13} />
                          Mermaid diagram generated
                        </span>
                      )}
                    </div>

                    {/* Tech stack tags */}
                    {techList.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {techList.slice(0, 6).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => onViewReport(reportId)}
                      disabled={reportId == null || reportLoadingId !== null || deletingReportId !== null}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 hover:border-emerald-400 disabled:opacity-50"
                    >
                      <Eye size={14} />
                      {reportLoadingId === reportId ? 'Opening...' : 'View report'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteReport(reportId, repositoryName)}
                      disabled={reportId == null || reportLoadingId !== null || deletingReportId !== null}
                      aria-label={`Delete report ${reportId}`}
                      className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400 transition hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-50"
                      title="Delete report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
