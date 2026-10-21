import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function AnalysisReportsList({
    reports,
    loading,
    reportLoadingId,
    deletingReportId,
    onRefresh,
    onViewReport,
    onDeleteReport,
}) {
    const [refreshAnimation, setRefreshAnimation] = useState(0);

    return (
        <section id="analysis">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">
                        AI analysis reports
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Reports saved by the analysis service.
                    </p>
                </div>


                <button
                    type="button"
                    onClick={() => {
                        setRefreshAnimation((animation) => animation + 1);
                        onRefresh();
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Refresh
                </button>

            </div>

            <div
                key={refreshAnimation}
                className={refreshAnimation ? 'list-refresh-flash' : ''}
            >
                {loading ? (
                    <p className="rounded-xl border border-slate-800 p-6 text-sm text-slate-400">
                        Loading analysis reports...
                    </p>
                ) : reports.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 p-6 text-sm text-slate-400">
                        No analysis reports yet. Analyze a repository to create one.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {reports.map((report, index) => {
                            const reportId =
                                report.id ??
                                report.reportId ??
                                report.analysisId;

                            const repositoryName =
                                report.repositoryName ||
                                report.repositoryInfo?.name ||
                                report.repository?.name ||
                                report.repository?.fullName;

                            const createdAt =
                                report.createdAt ??
                                report.created_at ??
                                report.timestamp;

                            return (
                                <article
                                    key={reportId ?? `report-${index}`}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111b2e] p-4"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 font-mono text-xs text-slate-300">
                                                {reportId != null
                                                    ? `#${reportId}`
                                                    : 'No ID'}
                                            </span>
                                            <h4 className="font-medium">
                                                {repositoryName ||
                                                    `Analysis report ${reportId ?? index + 1}`}
                                            </h4>
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {createdAt
                                                ? `Created ${new Date(createdAt).toLocaleString()}`
                                                : reportId != null
                                                    ? `Report #${reportId}`
                                                    : 'Analysis report'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onViewReport(reportId)}
                                            disabled={
                                                reportId == null ||
                                                reportLoadingId !== null ||
                                                deletingReportId !== null
                                            }
                                            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {reportLoadingId === reportId
                                                ? 'Loading...'
                                                : 'View report'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDeleteReport(reportId, repositoryName)
                                            }
                                            disabled={
                                                reportId == null ||
                                                reportLoadingId !== null ||
                                                deletingReportId !== null
                                            }
                                            aria-label={`Delete analysis for ${repositoryName || `report ${reportId}`}`}
                                            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:border-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Trash2 size={15} />
                                            {deletingReportId === reportId
                                                ? 'Deleting...'
                                                : 'Delete'}
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
