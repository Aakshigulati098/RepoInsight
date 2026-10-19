import {
  GitBranch,
  Plus,
  GitFork,
  Star,
  Activity,
  Sparkles,
  ArrowUpRight,
  Code2,
  X,
  Search,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
  getRepositories,
  importRepository,
  analyzeRepository,
  getAnalysisReports,
  getAnalysisReport,
} from './service/api.js';

function StatCard({ icon, label, value, note }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111b2e] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-emerald-300">{icon}</span>
      </div>
      <p className="mt-5 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function ReportSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#111b2e] p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">{title}</h3>
      {children}
    </section>
  );
}


function normalizeList(value) {
  if (Array.isArray(value)) return value;

  if (typeof value !== 'string') return [];

  const trimmed = value.trim();

  if (!trimmed) return [];

  // Handle JSON-formatted arrays returned by the backend or AI.
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Fall back to normal string processing.
    }
  }

  return trimmed
    .split(/\r?\n|,/)
    .map((item) => item.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}


function DataList({ items, emptyMessage = 'No data available.' }) {
  const values = normalizeList(items);

  if (!values.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {values.map((item, index) => {
        const label =
          typeof item === 'string'
            ? item
            : item?.path || item?.name || item?.filePath || JSON.stringify(item);

        return (
          <li
            key={`${index}-${label}`}
            className="break-words rounded-lg border border-slate-800 bg-[#0b1120] px-3 py-2 text-sm text-slate-300"
          >
            {label}
          </li>
        );
      })}
    </ul>
  );
}

function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [diagramError, setDiagramError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';
      setDiagramError('');

      if (!chart || typeof chart !== 'string' || !chart.trim()) return;

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
        });

        const id = `repo-diagram-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (!cancelled) {
          setDiagramError(
            'The saved diagram could not be rendered. You can inspect its source below.'
          );
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (!chart || typeof chart !== 'string' || !chart.trim()) {
    return (
      <p className="text-sm text-slate-500">
        No architecture diagram was saved in this report.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {diagramError && <p className="text-sm text-amber-300">{diagramError}</p>}
      <div
        ref={containerRef}
        className="min-h-8 overflow-x-auto rounded-lg bg-[#0b1120] p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      />
      <details className="rounded-lg border border-slate-800 p-3">
        <summary className="cursor-pointer text-sm text-emerald-300">
          View Mermaid source
        </summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-400">
          {chart}
        </pre>
      </details>
    </div>
  );
}

function AnalysisReportModal({ report, onClose }) {
  if (!report) return null;

  const repository = report.repositoryInfo || report.repository || {};
  const reportTitle =
    repository.name ||
    report.repositoryName ||
    repository.fullName ||
    `Analysis report #${report.id ?? ''}`;

  const technologies = normalizeList(report.technologies);
  const importantFiles = report.importantFiles || [];
  const sampleFiles = report.sampleFilePaths || [];
  const summary = report.aiSummary;
  const diagram = report.architectureDiagram;
  const status = report.status || 'Available';
  const createdAt = report.createdAt || report.created_at;

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
            <p className="mb-2 text-sm text-emerald-300">RepoInsight / Analysis</p>
            <h2
              id="report-dialog-title"
              className="break-words text-2xl font-bold text-slate-100"
            >
              {reportTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Report #{report.id ?? 'N/A'}
              {createdAt ? ` · ${new Date(createdAt).toLocaleString()}` : ''}
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
            <p className="mt-2 text-lg font-semibold text-emerald-300">{status}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#111b2e] p-4">
            <p className="text-sm text-slate-400">Files discovered</p>
            <p className="mt-2 text-lg font-semibold">{report.fileCount ?? 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#111b2e] p-4">
            <p className="text-sm text-slate-400">Repository language</p>
            <p className="mt-2 text-lg font-semibold">
              {repository.language || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <ReportSection title="AI-generated summary">
            {summary ? (
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {summary}
              </p>
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
              <p className="text-sm text-slate-500">No technologies were detected.</p>
            )}
          </ReportSection>

          <ReportSection title="Architecture diagram">
            <MermaidDiagram chart={diagram} />
          </ReportSection>

          <ReportSection title="Important files">
            <DataList items={importantFiles} />
          </ReportSection>

          <ReportSection title="Sample file paths">
            <DataList items={sampleFiles} />
            {report.treeTruncated && (
              <p className="mt-3 text-sm text-amber-300">
                The repository file tree was truncated, so this analysis may not
                include every file.
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
    </div>
  );
}

function App() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisReports, setAnalysisReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [error, setError] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoadingId, setReportLoadingId] = useState(null);

  async function loadRepositories() {
    try {
      const data = await getRepositories();
      setRepositories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load repositories.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalysisReports() {
    try {
      const reports = await getAnalysisReports();
      if (!Array.isArray(reports)) {
        throw new Error('Unexpected response while loading analysis reports.');
      }
      setAnalysisReports(reports);
    } catch (err) {
      setError(err.message || 'Unable to load analysis reports.');
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    getRepositories()
      .then((data) => {
        if (active) setRepositories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load repositories.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getAnalysisReports()
      .then((reports) => {
        if (!Array.isArray(reports)) {
          throw new Error('Unexpected response while loading analysis reports.');
        }
        if (active) setAnalysisReports(reports);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load analysis reports.');
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleImport(event) {
    event.preventDefault();
    const url = githubUrl.trim();

    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(url)) {
      setError('Enter a valid public GitHub repository URL.');
      return;
    }

    setImporting(true);
    setError('');
    setMessage('');

    try {
      const repository = await importRepository(url);
      setGithubUrl('');
      setModalOpen(false);
      setMessage(`Successfully imported ${repository?.name || 'repository'}.`);
      await loadRepositories();
    } catch (err) {
      setError(err.message || 'Could not import repository.');
    } finally {
      setImporting(false);
    }
  }

  async function handleAnalyze(repositoryId) {
    setAnalyzingId(repositoryId);
    setError('');
    setMessage('');

    try {
      await analyzeRepository(repositoryId);
      await loadAnalysisReports();
      setMessage('AI analysis completed successfully.');
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleViewReport(reportId) {
    if (reportId == null) {
      setError('This report does not have a valid ID.');
      return;
    }

    setReportLoadingId(reportId);
    setError('');
    try {
      const report = await getAnalysisReport(reportId);
      setSelectedReport(report);
    } catch (err) {
      setError(err.message || 'Unable to load analysis report.');
    } finally {
      setReportLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-[#0d1527] p-6 md:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400 p-2 text-slate-950">
            <GitFork size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold">RepoInsight</h1>
            <p className="text-xs text-slate-500">Repository intelligence</p>
          </div>
        </div>

        <p className="mb-3 mt-10 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>
        <nav className="space-y-2">
          <a
            href="#dashboard"
            className="flex items-center gap-3 rounded-lg bg-emerald-400/10 px-4 py-3 text-emerald-300"
          >
            <Activity size={18} /> Dashboard
          </a>
          <a
            href="#repositories"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800"
          >
            <GitBranch size={18} /> Repositories
          </a>
          <a
            href="#analysis"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800"
          >
            <Sparkles size={18} /> AI Analysis
          </a>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium">Powered by Gemini</p>
          <p className="mt-1 text-xs text-slate-500">
            Understand your codebase faster.
          </p>
        </div>
      </aside>

      <main id="dashboard" className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5 md:px-10">
          <div>
            <p className="text-sm text-slate-500">Workspace / Overview</p>
            <h2 className="mt-1 text-2xl font-bold">Dashboard</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setMessage('');
              setError('');
              setModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            <Plus size={18} /> Import repository
          </button>
        </header>

        <div className="space-y-8 p-6 md:p-10">
          <section>
            <h3 className="text-xl font-semibold">Welcome to RepoInsight</h3>
            <p className="mt-2 text-sm text-slate-400">
              Understand repositories with AI-powered codebase insights.
            </p>
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <p className="break-words">{error}</p>
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X size={17} />
              </button>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {message}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={<GitBranch size={20} />}
              label="Repositories"
              value={loading ? '...' : String(repositories.length).padStart(2, '0')}
              note="Loaded from your backend"
            />
            <StatCard
              icon={<Sparkles size={20} />}
              label="AI analyses"
              value={reportsLoading ? '...' : String(analysisReports.length).padStart(2, '0')}
              note="Saved analysis reports"
            />
            <StatCard
              icon={<Activity size={20} />}
              label="System status"
              value={error ? 'Check' : loading ? 'Loading' : 'Ready'}
              note={error ? 'Check backend connection' : 'Repository API'}
            />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#111b2e] p-5 md:p-7">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
                <Sparkles size={23} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analyze a repository</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Import a public GitHub repository to get started.
                </p>
              </div>
            </div>

            <form onSubmit={handleImport} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-700 bg-[#0b1120] px-4">
                <GitBranch size={19} className="shrink-0 text-slate-500" />
                <input
                  type="url"
                  required
                  value={githubUrl}
                  onChange={(event) => setGithubUrl(event.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={importing}
                className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? 'Importing...' : 'Import repository'}
              </button>
            </form>
          </section>

          <section id="analysis">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">AI analysis reports</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Reports saved by the analysis service.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAnalysisReports}
                disabled={reportsLoading}
                className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
              >
                <Search size={16} /> Refresh
              </button>
            </div>

            {reportsLoading ? (
              <p className="rounded-xl border border-slate-800 p-6 text-sm text-slate-400">
                Loading analysis reports...
              </p>
            ) : analysisReports.length === 0 ? (
              <div className="rounded-xl border border-slate-800 p-6 text-sm text-slate-400">
                No analysis reports yet. Analyze a repository to create one.
              </div>
            ) : (
              <div className="grid gap-3">
                {analysisReports.map((report, index) => {
                  const reportId = report.id ?? report.reportId ?? report.analysisId;
                  const repositoryName =
                    report.repositoryName ||
                    report.repositoryInfo?.name ||
                    report.repository?.name ||
                    report.repository?.fullName;
                  const createdAt =
                    report.createdAt ?? report.created_at ?? report.timestamp;

                  return (
                    <article
                      key={reportId ?? `report-${index}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111b2e] p-4"
                    >
                      <div>
                        <h4 className="font-medium">
                          {repositoryName || `Analysis report ${reportId ?? index + 1}`}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {createdAt
                            ? `Created ${new Date(createdAt).toLocaleString()}`
                            : reportId != null
                              ? `Report #${reportId}`
                              : 'Analysis report'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewReport(reportId)}
                        disabled={reportId == null || reportLoadingId !== null}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reportLoadingId === reportId ? 'Loading...' : 'View report'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="repositories">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Repositories</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Live data from your Spring Boot backend.
                </p>
              </div>
              <button
                type="button"
                onClick={loadRepositories}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
              >
                <Search size={16} /> Refresh
              </button>
            </div>

            {loading ? (
              <p className="rounded-xl border border-slate-800 p-6 text-sm text-slate-400">
                Loading repositories...
              </p>
            ) : repositories.length === 0 ? (
              <div className="rounded-xl border border-slate-800 p-8 text-center">
                <GitBranch className="mx-auto text-slate-500" size={32} />
                <p className="mt-3 font-medium">No repositories yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Import a public GitHub repository to begin.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {repositories.map((repo) => (
                  <article
                    key={repo.id}
                    className="rounded-xl border border-slate-800 bg-[#111b2e] p-5 transition hover:border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-800 p-2.5">
                          <Code2 size={21} className="text-emerald-300" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{repo.name}</h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Repository #{repo.id}
                          </p>
                        </div>
                      </div>
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${repo.name} on GitHub`}
                        className="text-slate-500 hover:text-emerald-300"
                      >
                        <ArrowUpRight size={18} />
                      </a>
                    </div>

                    <p className="my-5 line-clamp-3 min-h-12 text-sm leading-6 text-slate-400">
                      {repo.description || 'No description available.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-orange-300" />
                        {repo.language || 'Not detected'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Star size={14} />
                        {repo.stars == null ? 'N/A' : Number(repo.stars).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAnalyze(repo.id)}
                        disabled={importing || analyzingId !== null}
                        className="ml-auto rounded-full bg-emerald-400/10 px-3 py-1.5 text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} />
                          {analyzingId === repo.id ? 'Analyzing...' : 'Analyze'}
                        </span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="pb-4 text-center text-xs text-slate-600">
            RepoInsight · AI-powered repository intelligence
          </p>
        </div>
      </main>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleImport}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#111b2e] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Import repository</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Enter the URL of a public GitHub repository.
            </p>
            <input
              type="url"
              required
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="mt-5 w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm outline-none focus:border-emerald-400"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </form>
        </div>
      )}

      <AnalysisReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

export default App;
