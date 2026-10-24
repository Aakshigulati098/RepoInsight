import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FolderGit2,
  GitBranch,
  GitFork,
  MessageCircle,
  Plus,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import StatCard from '../../components/Statcard.jsx';

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Java: '#b07219',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Shell: '#89e051',
  Dockerfile: '#384d54',
};

export default function DashboardOverview({
  repositories = [],
  analysisReports = [],
  indexingStatuses = {},
  onNavigateTab,
  onOpenImport,
  onImport,
  importing,
  onViewReport,
  onChat,
}) {
  const [quickUrl, setQuickUrl] = useState('');

  // Calculate metrics
  const totalRepos = repositories.length;
  const totalReports = analysisReports.length;

  const totalStars = useMemo(() => {
    return repositories.reduce((sum, r) => sum + (Number(r.stars) || 0), 0);
  }, [repositories]);

  const totalForks = useMemo(() => {
    return repositories.reduce((sum, r) => sum + (Number(r.forks) || 0), 0);
  }, [repositories]);

  // Indexing status statistics
  const indexedCount = useMemo(() => {
    return repositories.filter(
      (r) => String(indexingStatuses[r.id]?.status || '').toUpperCase() === 'COMPLETED'
    ).length;
  }, [repositories, indexingStatuses]);

  const indexingPercentage = totalRepos > 0 ? Math.round((indexedCount / totalRepos) * 100) : 0;

  // Language breakdown
  const languageStats = useMemo(() => {
    const counts = {};
    for (const repo of repositories) {
      const lang = repo.language || 'Other';
      counts[lang] = (counts[lang] || 0) + 1;
    }
    const total = repositories.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
        color: LANGUAGE_COLORS[name] || '#94a3b8',
      }))
      .sort((a, b) => b.count - a.count);
  }, [repositories]);

  // Handle inline quick import
  const handleQuickImport = (e) => {
    e.preventDefault();
    if (quickUrl.trim()) {
      onImport(quickUrl.trim());
      setQuickUrl('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-r from-[#0d1627] via-[#101b31] to-[#0b1220] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Zap size={13} className="text-emerald-400" />
            AI-Powered Intelligence Platform
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Welcome to your Repository Hub
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            RepoInsight synchronizes your GitHub repositories, prepares code for Q&amp;A, and generates architecture diagrams.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('repositories')}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-300 active:scale-95"
            >
              <FolderGit2 size={16} />
              Explore Repositories ({totalRepos})
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analysis')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <Sparkles size={16} className="text-emerald-400" />
              View Analysis Reports ({totalReports})
            </button>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-12 bottom-0 hidden opacity-20 lg:block">
          <Code2 size={220} className="text-emerald-400" />
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FolderGit2 size={20} />}
          label="Tracked Repositories"
          value={totalRepos}
          note={totalRepos > 0 ? `${languageStats.length} distinct technologies` : 'No repositories imported'}
          trend={totalRepos > 0 ? 'Active' : null}
          color="emerald"
        />

        <StatCard
          icon={<Database size={20} />}
          label="Code Q&A Readiness"
          value={`${indexingPercentage}%`}
          note={`${indexedCount} of ${totalRepos} codebases ready for Q&A`}
          trend={indexedCount > 0 ? `${indexedCount} ready` : '0 ready'}
          color="cyan"
        />

        <StatCard
          icon={<Sparkles size={20} />}
          label="AI Analysis Reports"
          value={totalReports}
          note="Architectures & code audits"
          trend={totalReports > 0 ? 'Gemini 3' : 'Ready'}
          color="purple"
        />

        <StatCard
          icon={<Star size={20} />}
          label="Community Traction"
          value={Number(totalStars).toLocaleString()}
          note={`${Number(totalForks).toLocaleString()} forks across projects`}
          trend={totalStars > 0 ? '★ Stars' : null}
          color="amber"
        />
      </div>

      {/* Two Column Layout: Quick Import & Tech Stack Breakdown */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick Import Card (3 cols) */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-6 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-500/20">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Quick Import Repository
              </h3>
              <p className="text-xs text-slate-400">
                Provide any public GitHub URL to ingest its codebase and metadata.
              </p>
            </div>
          </div>

          <form onSubmit={handleQuickImport} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex flex-1 items-center rounded-xl border border-slate-700/80 bg-[#090f1b] px-3.5 focus-within:border-emerald-400">
              <GitBranch size={16} className="text-slate-500 shrink-0" />
              <input
                type="url"
                required
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full bg-transparent px-3 py-3 text-xs outline-none placeholder:text-slate-600 text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3 text-xs font-bold text-slate-950 transition hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60 shadow-lg shadow-emerald-500/15 shrink-0"
            >
              {importing ? (
                <>Importing...</>
              ) : (
                <>
                  <Plus size={15} />
                  Import
                </>
              )}
            </button>
          </form>

          {/* Preset Example Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Try examples:</span>
            {[
              'https://github.com/facebook/react',
              'https://github.com/spring-projects/spring-boot',
              'https://github.com/golang/go',
            ].map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setQuickUrl(url)}
                className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-400 hover:border-slate-700 hover:text-emerald-300"
              >
                {url.split('/').slice(-2).join('/')}
              </button>
            ))}
          </div>
        </div>

        {/* Technology & Language Distribution (2 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-6 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Tech Stack Distribution
              </h3>
              <span className="text-xs text-slate-500">
                {languageStats.length} languages
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Primary programming languages across all repositories.
            </p>

            {/* Visual Segmented Progress Bar */}
            <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-800/80">
              {languageStats.map((item) => (
                <div
                  key={item.name}
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.name}: ${item.count} repos (${item.percent}%)`}
                  className="transition-all hover:opacity-80"
                />
              ))}
            </div>

            {/* Language Breakdown Pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {languageStats.slice(0, 6).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#090f1b] px-2.5 py-1 text-xs text-slate-300"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500 flex justify-between">
            <span>Total Repositories</span>
            <span className="font-semibold text-slate-300">{totalRepos}</span>
          </div>
        </div>
      </div>

      {/* Recent AI Analysis Reports Preview */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Recent AI Architecture Reports
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Latest architectural breakdowns and tech stack discoveries.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('analysis')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            All Reports ({totalReports})
            <ArrowUpRight size={15} />
          </button>
        </div>

        {analysisReports.length === 0 ? (
          <div className="mt-5 rounded-xl border border-slate-800/80 bg-[#090f1b] p-8 text-center">
            <Sparkles size={28} className="mx-auto text-slate-600" />
            <p className="mt-2 text-xs font-medium text-slate-400">
              No analysis reports yet.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Go to Repositories and click "Analyze" on any repository to generate your first audit.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('repositories')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <FolderGit2 size={14} />
              Browse Repositories
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysisReports.slice(0, 3).map((report) => {
              const reportId = report.id ?? report.reportId ?? report.analysisId;
              const repo = report.repositoryInfo || {};
              const status = String(report.status || 'PENDING').toUpperCase();

              return (
                <div
                  key={reportId}
                  onClick={() => onViewReport(reportId)}
                  className="group cursor-pointer rounded-xl border border-slate-800 bg-[#090f1b] p-4 transition hover:border-slate-700 hover:bg-[#0c1424]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500">
                        Report #{reportId}
                      </span>
                      <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300">
                        {repo.name || `Repository #${repo.id || 'N/A'}`}
                      </h4>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        status === 'COMPLETED'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : status === 'FAILED'
                          ? 'border-red-500/30 bg-red-500/10 text-red-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                    {report.aiSummary
                      ? report.aiSummary.replace(/^#+\s+/g, '')
                      : 'Architecture analysis ready for review.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
                    <span>{report.fileCount != null ? `${report.fileCount} files scanned` : 'Code scanned'}</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      Inspect
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
