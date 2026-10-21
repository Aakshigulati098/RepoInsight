import {
  GitBranch,
  Plus,
  GitFork,
  Activity,
  Sparkles,
  X,
  Trash2,
  MessageCircle,
} from 'lucide-react';

import { useEffect, useState, useCallback } from 'react';

import {
  getRepositories,
  importRepository,
  deleteRepository,
  analyzeRepository,
  getAnalysisReports,
  getAnalysisReport,
  deleteAnalysisReport,
  chatWithRepository,
} from './service/api.js';

import AnalysisReportModal from './features/analysis/AnalysisReportModal';
import AnalysisReportsList from './features/analysis/AnalysisReportsList';
import RepositoryList from './features/repositories/RepositoryList';

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
  const [chatRepository, setChatRepository] = useState(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState(null);
  const [chatSources, setChatSources] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoadingId, setReportLoadingId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [deletingRepositoryId, setDeletingRepositoryId] = useState(null);
  const [pendingDeletion, setPendingDeletion] = useState(null);

  // Load repositories from the backend.
  const loadRepositories = useCallback(async () => {
    try {
      const data = await getRepositories();
      setRepositories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load repositories.');
    } finally {
      setLoading(false);
    }
  }, []);


  // Load saved AI analysis reports.
  const loadAnalysisReports = useCallback(async () => {
    try {
      const reports = await getAnalysisReports();

      if (!Array.isArray(reports)) {
        throw new Error(
          'Unexpected response while loading analysis reports.'
        );
      }

      setAnalysisReports(reports);
    } catch (err) {
      setError(err.message || 'Unable to load analysis reports.');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepositories();
    loadAnalysisReports();
  }, [loadRepositories, loadAnalysisReports]);


  useEffect(() => {
    const hasActiveReports = analysisReports.some((report) => {
      const status = String(report.status ?? '').toUpperCase();

      return status === 'PENDING' || status === 'IN_PROGRESS';
    });

    if (!hasActiveReports) {
      return;
    }

    const intervalId = setInterval(() => {
      loadAnalysisReports();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [analysisReports, loadAnalysisReports]);


useEffect(() => {
  if (!selectedReport) return;

  const status = String(selectedReport.status ?? '').toUpperCase();

  if (status !== 'PENDING' && status !== 'IN_PROGRESS') {
    return;
  }

  const reportId =
    selectedReport.id ??
    selectedReport.reportId ??
    selectedReport.analysisId;

  if (reportId == null) return;

  let cancelled = false;

  const refreshSelectedReport = async () => {
    try {
      const updatedReport = await getAnalysisReport(reportId);

      if (cancelled) return;

      setSelectedReport(updatedReport);

      setAnalysisReports((reports) =>
        reports.map((report) => {
          const id = report.id ?? report.reportId ?? report.analysisId;
          return id === reportId ? updatedReport : report;
        })
      );
    } catch (err) {
      console.error('Unable to refresh analysis report:', err);
    }
  };

  const intervalId = setInterval(refreshSelectedReport, 3000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}, [selectedReport]);

  // Import a public GitHub repository.
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

      setMessage(
        `Successfully imported ${repository?.name || 'repository'}.`
      );

      await loadRepositories();
    } catch (err) {
      setError(err.message || 'Could not import repository.');
    } finally {
      setImporting(false);
    }
  }

  // Start AI analysis for a repository.
  async function handleAnalyze(repositoryId) {
    setAnalyzingId(repositoryId);
    setError('');
    setMessage('');

    try {
      const report = await analyzeRepository(repositoryId);

      await loadAnalysisReports();

      setMessage(
        `Analysis queued successfully${report?.id ? ` (Report #${report.id})` : ''
        }. Tracking its progress in AI Analysis.`
      );
    } catch (err) {
      setError(err.message || 'Unable to start analysis.');
    } finally {
      setAnalyzingId(null);
    }
  }

  function openRepositoryChat(repository) {
    setChatRepository(repository);
    setChatQuestion('');
    setChatAnswer(null);
    setChatSources([]);
    setError('');
    setMessage('');
  }

  async function handleRepositoryChat(event) {
    event.preventDefault();
    if (!chatRepository || !chatQuestion.trim()) return;
    setChatLoading(true);
    setError('');
    setChatAnswer(null);
    setChatSources([]);
    try {
      const result = await chatWithRepository(chatRepository.id, chatQuestion.trim());
      setChatAnswer(result?.answer ?? result?.response ?? result?.message ?? 'The API returned no answer.');
      setChatSources(Array.isArray(result?.sources) ? result.sources : []);
    } catch (err) {
      setError(err.message || 'Unable to ask a question about this repository.');
    } finally {
      setChatLoading(false);
    }
  }

  // Fetch the complete report before opening its modal.
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

  function handleDeleteReport(reportId, repositoryName) {
    if (reportId == null) {
      setError('This report does not have a valid ID.');
      return;
    }

    setPendingDeletion({
      type: 'analysis',
      id: reportId,
      label: repositoryName || `report #${reportId}`,
    });
  }

  function handleDeleteRepository(repositoryId, repositoryName) {
    if (repositoryId == null) {
      setError('This repository does not have a valid ID.');
      return;
    }

    setPendingDeletion({
      type: 'repository',
      id: repositoryId,
      label: repositoryName || `repository #${repositoryId}`,
    });
  }

  async function confirmDeletion() {
    if (!pendingDeletion) return;

    const { type, id, label } = pendingDeletion;
    if (type === 'analysis') {
      setDeletingReportId(id);
    } else {
      setDeletingRepositoryId(id);
    }
    setError('');
    setMessage('');

    try {
      if (type === 'analysis') {
        await deleteAnalysisReport(id);
        setAnalysisReports((reports) =>
          reports.filter(
            (report) =>
              (report.id ?? report.reportId ?? report.analysisId) !== id
          )
        );
        if (
          selectedReport?.id === id ||
          selectedReport?.reportId === id ||
          selectedReport?.analysisId === id
        ) {
          setSelectedReport(null);
        }
      } else {
        await deleteRepository(id);
        setRepositories((items) =>
          items.filter((repository) => repository.id !== id)
        );
      }
      setPendingDeletion(null);
      setMessage(
        type === 'analysis'
          ? `Deleted analysis for ${label}.`
          : `Deleted ${label}.`
      );
    } catch (err) {
      setError(
        err.message ||
        (type === 'analysis'
          ? 'Unable to delete analysis report.'
          : 'Unable to delete repository.')
      );
      setPendingDeletion(null);
    } finally {
      if (type === 'analysis') {
        setDeletingReportId(null);
      } else {
        setDeletingRepositoryId(null);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-[#0d1527] p-6 md:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400 p-2 text-slate-950">
            <GitFork size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold">RepoInsight</h1>
            <p className="text-xs text-slate-500">
              Repository intelligence
            </p>
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
            <Activity size={18} />
            Dashboard
          </a>

          <a
            href="#repositories"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800"
          >
            <GitBranch size={18} />
            Repositories
          </a>

          <a
            href="#analysis"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800"
          >
            <Sparkles size={18} />
            AI Analysis
          </a>
        </nav>

        <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium">Powered by Gemini</p>
          <p className="mt-1 text-xs text-slate-500">
            Understand your codebase faster.
          </p>
        </div>
      </aside>

      {/* Main dashboard */}
      <main id="dashboard" className="md:ml-64">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5 md:px-10">
          <div>
            <p className="text-sm text-slate-500">
              Workspace / Overview
            </p>
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
            <Plus size={18} />
            Import repository
          </button>
        </header>

        <div className="space-y-8 p-6 md:p-10">
          {/* Welcome */}
          <section>
            <h3 className="text-xl font-semibold">
              Welcome to RepoInsight
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Understand repositories with AI-powered codebase insights.
            </p>
          </section>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <p className="break-words">{error}</p>

              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Success message */}
          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {message}
            </div>
          )}

          {/* Statistics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={<GitBranch size={20} />}
              label="Repositories"
              value={
                loading
                  ? '...'
                  : String(repositories.length).padStart(2, '0')
              }
              note="Loaded from your backend"
            />

            <StatCard
              icon={<Sparkles size={20} />}
              label="AI analyses"
              value={
                reportsLoading
                  ? '...'
                  : String(analysisReports.length).padStart(2, '0')
              }
              note="Saved analysis reports"
            />

            <StatCard
              icon={<Activity size={20} />}
              label="System status"
              value={error ? 'Check' : loading ? 'Loading' : 'Ready'}
              note={
                error
                  ? 'Check backend connection'
                  : 'Repository API'
              }
            />
          </section>

          {/* Quick repository import */}
          <section className="rounded-2xl border border-slate-800 bg-[#111b2e] p-5 md:p-7">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
                <Sparkles size={23} />
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  Analyze a repository
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Import a public GitHub repository to get started.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleImport}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-700 bg-[#0b1120] px-4">
                <GitBranch
                  size={19}
                  className="shrink-0 text-slate-500"
                />

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

          {/* AI analysis reports */}
          <AnalysisReportsList
            reports={analysisReports}
            loading={reportsLoading}
            reportLoadingId={reportLoadingId}
            deletingReportId={deletingReportId}
            onRefresh={loadAnalysisReports}
            onViewReport={handleViewReport}
            onDeleteReport={handleDeleteReport}
          />

          {/* Repository list */}
          <RepositoryList
            repositories={repositories}
            loading={loading}
            importing={importing}
            analyzingId={analyzingId}
            deletingRepositoryId={deletingRepositoryId}
            onAnalyze={handleAnalyze}
            onChat={openRepositoryChat}
            onDelete={handleDeleteRepository}
            onRefresh={loadRepositories}
          />

          <p className="pb-4 text-center text-xs text-slate-600">
            RepoInsight · AI-powered repository intelligence
          </p>
        </div>
      </main>

      {/* Repository code Q&A modal */}
      {chatRepository && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !chatLoading && setChatRepository(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="repository-chat-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#111b2e] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-cyan-300"><MessageCircle size={19} /><span className="text-xs font-semibold uppercase tracking-wider">Repository Q&A</span></div>
                <h3 id="repository-chat-title" className="mt-2 text-lg font-semibold">Ask {chatRepository.name}</h3>
                <p className="mt-1 text-sm text-slate-400">Ask questions about this repository's source code.</p>
              </div>
              <button type="button" onClick={() => setChatRepository(null)} disabled={chatLoading} aria-label="Close repository Q&A" className="text-slate-400 hover:text-white disabled:opacity-50"><X size={20} /></button>
            </div>
            <form onSubmit={handleRepositoryChat} className="mt-5 space-y-3">
              <textarea value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} required rows={3} maxLength={1500} placeholder="e.g. Where is authentication handled, and how does the request flow work?" className="w-full resize-y rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm outline-none focus:border-cyan-400" />
              <div className="flex justify-end">
                <button type="submit" disabled={chatLoading || !chatQuestion.trim()} className="flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle size={15} />{chatLoading ? 'Thinking...' : 'Ask question'}</button>
              </div>
            </form>
            {chatAnswer && <div className="mt-5 max-h-[40vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#0b1120] p-4"><h4 className="mb-2 text-sm font-semibold text-emerald-300">Answer</h4><p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{chatAnswer}</p>{chatSources.length > 0 && <div className="mt-4 border-t border-slate-800 pt-3"><h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Sources</h5><ul className="space-y-1">{chatSources.map((source, index) => { const label = typeof source === 'string' ? source : source?.filePath ?? source?.metadata?.filePath ?? source?.content ?? `Source ${index + 1}`; return <li key={`${label}-${index}`} className="break-all text-xs text-cyan-200">{label}</li>; })}</ul></div>}</div>}
          </section>
        </div>
      )}

      {/* Import repository modal */}
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
              <h3 className="text-lg font-semibold">
                Import repository
              </h3>

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

      {pendingDeletion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            if (deletingReportId === null && deletingRepositoryId === null) {
              setPendingDeletion(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-report-title"
            aria-describedby="delete-report-description"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111b2e] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-500/10 p-3 text-red-300">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 id="delete-report-title" className="text-lg font-semibold">
                  {pendingDeletion.type === 'analysis'
                    ? 'Delete analysis report?'
                    : 'Delete repository?'}
                </h3>
                <p
                  id="delete-report-description"
                  className="mt-2 text-sm text-slate-400"
                >
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-slate-200">
                    {pendingDeletion.label}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeletion(null)}
                disabled={
                  deletingReportId !== null ||
                  deletingRepositoryId !== null
                }
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                No, keep it
              </button>
              <button
                type="button"
                onClick={confirmDeletion}
                disabled={
                  deletingReportId !== null ||
                  deletingRepositoryId !== null
                }
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />
                {deletingReportId !== null || deletingRepositoryId !== null
                  ? 'Deleting...'
                  : 'Yes, delete'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Extracted analysis report component */}
      <AnalysisReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

export default App;
