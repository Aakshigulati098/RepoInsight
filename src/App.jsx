import {
  GitBranch,
  Plus,
  GitFork,
  Activity,
  Sparkles,
  X,
} from 'lucide-react';

import { useEffect, useState, useCallback } from 'react';

import {
  getRepositories,
  importRepository,
  analyzeRepository,
  getAnalysisReports,
  getAnalysisReport,
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
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoadingId, setReportLoadingId] = useState(null);

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
      await analyzeRepository(repositoryId);
      await loadAnalysisReports();

      setMessage('AI analysis completed successfully.');
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setAnalyzingId(null);
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
            onRefresh={loadAnalysisReports}
            onViewReport={handleViewReport}
          />

          {/* Repository list */}
          <RepositoryList
            repositories={repositories}
            loading={loading}
            importing={importing}
            analyzingId={analyzingId}
            onAnalyze={handleAnalyze}
            onRefresh={loadRepositories}
          />

          <p className="pb-4 text-center text-xs text-slate-600">
            RepoInsight · AI-powered repository intelligence
          </p>
        </div>
      </main>

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

      {/* Extracted analysis report component */}
      <AnalysisReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

export default App;
