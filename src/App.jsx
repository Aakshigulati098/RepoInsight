import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  GitBranch,
  Plus,
  GitFork,
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  MessageSquareCode,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';

import {
  getRepositories,
  importRepository,
  deleteRepository,
  analyzeRepository,
  getAnalysisReports,
  getAnalysisReport,
  deleteAnalysisReport,
  startRepositoryIndexing,
  getRepositoryIndexingStatus,
} from './service/api.js';

import Sidebar from './components/Sidebar.jsx';
import DashboardOverview from './features/dashboard/DashboardOverview.jsx';
import RepositoryList from './features/repositories/RepositoryList.jsx';
import AnalysisReportsList from './features/analysis/AnalysisReportsList.jsx';
import ChatWorkspaceView from './features/chat/ChatWorkspaceView.jsx';
import ImportRepositoryModal from './components/ImportRepositoryModal.jsx';
import AnalysisReportModal from './features/analysis/AnalysisReportModal.jsx';
import RepositoryChatModal from './components/RepositoryChatModel.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'repositories' | 'analysis' | 'chat'
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [analysisReports, setAnalysisReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const [analyzingId, setAnalyzingId] = useState(null);
  const [chatRepository, setChatRepository] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoadingId, setReportLoadingId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [deletingRepositoryId, setDeletingRepositoryId] = useState(null);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [indexingStatuses, setIndexingStatuses] = useState({});
  const [indexingId, setIndexingId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        throw new Error('Unexpected response while loading analysis reports.');
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

  // Load the saved indexing status for each repository.
  useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      const results = await Promise.all(
        repositories.map(async (repository) => {
          try {
            const status = await getRepositoryIndexingStatus(repository.id);
            return [repository.id, status];
          } catch {
            return [
              repository.id,
              { status: 'NOT_INDEXED', progress: 0, chunksIndexed: 0 },
            ];
          }
        })
      );

      if (cancelled) return;
      setIndexingStatuses((current) => {
        const next = { ...current };
        for (const [id, status] of results) {
          next[id] = status;
        }
        return next;
      });
    }

    if (repositories.length) loadStatuses();
    return () => {
      cancelled = true;
    };
  }, [repositories]);

  // Poll only repositories that are actively indexing.
  useEffect(() => {
    const activeIds = Object.entries(indexingStatuses)
      .filter(([, value]) => ['PENDING', 'IN_PROGRESS'].includes(String(value?.status || '').toUpperCase()))
      .map(([id]) => id);

    if (!activeIds.length) return;

    let cancelled = false;
    const refreshStatuses = async () => {
      const results = await Promise.all(
        activeIds.map(async (id) => {
          try {
            return [id, await getRepositoryIndexingStatus(id)];
          } catch {
            return [id, null];
          }
        })
      );
      if (cancelled) return;
      setIndexingStatuses((current) => {
        const next = { ...current };
        for (const [id, status] of results) if (status) next[id] = status;
        return next;
      });
    };

    const intervalId = setInterval(refreshStatuses, 2000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [indexingStatuses]);

  // Poll active analysis reports
  useEffect(() => {
    const hasActiveReports = analysisReports.some((report) => {
      const status = String(report.status ?? '').toUpperCase();
      return status === 'PENDING' || status === 'IN_PROGRESS';
    });

    if (!hasActiveReports) return;

    const intervalId = setInterval(() => {
      loadAnalysisReports();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [analysisReports, loadAnalysisReports]);

  // Poll selected report if in progress
  useEffect(() => {
    if (!selectedReport) return;
    const status = String(selectedReport.status ?? '').toUpperCase();
    if (status !== 'PENDING' && status !== 'IN_PROGRESS') return;

    const reportId = selectedReport.id ?? selectedReport.reportId ?? selectedReport.analysisId;
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

  // Handlers
  async function handleImportUrl(url) {
    setImporting(true);
    setError('');
    setMessage('');

    try {
      const repository = await importRepository(url);
      if (repository?.id != null) {
        setIndexingStatuses((current) => ({
          ...current,
          [repository.id]: {
            status: 'NOT_INDEXED',
            progress: 0,
            chunksIndexed: 0,
          },
        }));
      }
      setModalOpen(false);
      setMessage(`Successfully imported ${repository?.name || 'repository'}.`);
      await loadRepositories();
    } catch (err) {
      setError(err.message || 'Could not import repository.');
    } finally {
      setImporting(false);
    }
  }

  async function handleIndexRepository(repositoryId) {
    setIndexingId(repositoryId);
    setError('');
    setMessage('');
    setIndexingStatuses((current) => ({
      ...current,
      [repositoryId]: { status: 'IN_PROGRESS', progress: 0, chunksIndexed: 0, error: null },
    }));

    try {
      await startRepositoryIndexing(repositoryId);
      const status = await getRepositoryIndexingStatus(repositoryId);
      setIndexingStatuses((current) => ({ ...current, [repositoryId]: status }));
      setMessage('Code preparation for Q&A has started in the background.');
    } catch (err) {
      setIndexingStatuses((current) => ({
        ...current,
        [repositoryId]: { status: 'FAILED', progress: 0, error: err.message || 'Unable to prepare code for Q&A.' },
      }));
      setError(err.message || 'Unable to prepare code for Q&A.');
    } finally {
      setIndexingId(null);
    }
  }

  async function handleAnalyze(repositoryId) {
    setAnalyzingId(repositoryId);
    setError('');
    setMessage('');

    try {
      const report = await analyzeRepository(repositoryId);
      await loadAnalysisReports();
      setMessage(
        `Analysis queued successfully${report?.id ? ` (Report #${report.id})` : ''}. Tracking progress in AI Analysis.`
      );
    } catch (err) {
      setError(err.message || 'Unable to start analysis.');
    } finally {
      setAnalyzingId(null);
    }
  }

  function openRepositoryChat(repository) {
    const status = String(
      indexingStatuses[repository.id]?.status || 'NOT_INDEXED'
    ).toUpperCase();
    if (status !== 'COMPLETED') {
      setError('Optimize code for Q&A before asking questions about this repository.');
      setMessage('');
      return;
    }
    setChatRepository(repository);
    setError('');
    setMessage('');
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

  function handleDeleteReport(reportId, repositoryName) {
    setPendingDeletion({
      type: 'analysis',
      id: reportId,
      label: repositoryName || `report #${reportId}`,
    });
  }

  function handleDeleteRepository(repositoryId, repositoryName) {
    setPendingDeletion({
      type: 'repository',
      id: repositoryId,
      label: repositoryName || `repository #${repositoryId}`,
    });
  }

  async function confirmDeletion() {
    if (!pendingDeletion) return;
    const { type, id, label } = pendingDeletion;

    if (type === 'analysis') setDeletingReportId(id);
    else setDeletingRepositoryId(id);

    setError('');
    setMessage('');

    try {
      if (type === 'analysis') {
        await deleteAnalysisReport(id);
        setAnalysisReports((reports) =>
          reports.filter((r) => (r.id ?? r.reportId ?? r.analysisId) !== id)
        );
        if (selectedReport?.id === id || selectedReport?.reportId === id || selectedReport?.analysisId === id) {
          setSelectedReport(null);
        }
      } else {
        await deleteRepository(id);
        setRepositories((items) => items.filter((r) => r.id !== id));
      }
      setPendingDeletion(null);
      setMessage(type === 'analysis' ? `Deleted analysis for ${label}.` : `Deleted ${label}.`);
    } catch (err) {
      setError(
        err.message || (type === 'analysis' ? 'Unable to delete analysis report.' : 'Unable to delete repository.')
      );
      setPendingDeletion(null);
    } finally {
      if (type === 'analysis') setDeletingReportId(null);
      else setDeletingRepositoryId(null);
    }
  }

  const indexedCount = useMemo(() => {
    return repositories.filter(
      (r) => String(indexingStatuses[r.id]?.status || '').toUpperCase() === 'COMPLETED'
    ).length;
  }, [repositories, indexingStatuses]);

  // Tab titles
  const tabTitles = {
    dashboard: 'Dashboard',
    repositories: 'Repositories',
    analysis: 'AI Analysis Reports',
    chat: 'Codebase Q&A',
  };

  return (
    <div className="min-h-screen bg-[#070c16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        repositoryCount={repositories.length}
        reportCount={analysisReports.length}
        indexedCount={indexedCount}
        onOpenImport={() => {
          setError('');
          setMessage('');
          setModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header / App Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#070c16]/85 px-4 sm:px-8 backdrop-blur-md">
          {/* Mobile hamburger & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-slate-300 font-semibold">{tabTitles[activeTab]}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/15 transition hover:from-emerald-300 hover:to-teal-300"
            >
              <Plus size={14} />
              Import Repository
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-800 bg-[#0a101d] p-4 md:hidden">
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'repositories', label: 'Repositories', icon: FolderGit2, badge: repositories.length },
                { id: 'analysis', label: 'AI Analysis', icon: Sparkles, badge: analysisReports.length },
                { id: 'chat', label: 'Code Q&A', icon: MessageSquareCode },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-medium ${
                      activeTab === item.id
                        ? 'bg-emerald-400/10 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} />
                      {item.label}
                    </div>
                    {item.badge != null && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Body content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Notification Messages */}
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 shadow-md">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span className="break-words">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {message && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{message}</span>
              </div>
              <button
                type="button"
                onClick={() => setMessage('')}
                className="text-emerald-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Active View Switcher */}
          {activeTab === 'dashboard' && (
            <DashboardOverview
              repositories={repositories}
              analysisReports={analysisReports}
              indexingStatuses={indexingStatuses}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenImport={() => setModalOpen(true)}
              onImport={handleImportUrl}
              importing={importing}
              onViewReport={handleViewReport}
              onChat={openRepositoryChat}
            />
          )}

          {activeTab === 'repositories' && (
            <RepositoryList
              repositories={repositories}
              loading={loading}
              importing={importing}
              analyzingId={analyzingId}
              deletingRepositoryId={deletingRepositoryId}
              indexingStatuses={indexingStatuses}
              indexingId={indexingId}
              onIndex={handleIndexRepository}
              onAnalyze={handleAnalyze}
              onChat={openRepositoryChat}
              onDelete={handleDeleteRepository}
              onRefresh={loadRepositories}
              onOpenImport={() => setModalOpen(true)}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisReportsList
              reports={analysisReports}
              loading={reportsLoading}
              reportLoadingId={reportLoadingId}
              deletingReportId={deletingReportId}
              onRefresh={loadAnalysisReports}
              onViewReport={handleViewReport}
              onDeleteReport={handleDeleteReport}
            />
          )}

          {activeTab === 'chat' && (
            <ChatWorkspaceView
              repositories={repositories}
              indexingStatuses={indexingStatuses}
              onSelectRepoForChat={openRepositoryChat}
              onIndexRepo={handleIndexRepository}
              indexingId={indexingId}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-600">
          RepoInsight v2.0 · AI-powered repository intelligence · Powered by Spring AI &amp; pgvector
        </footer>
      </div>

      {/* Import Modal */}
      <ImportRepositoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onImport={handleImportUrl}
        importing={importing}
        error={error}
      />

      {/* Code Q&A Modal */}
      {chatRepository && (
        <RepositoryChatModal
          repository={chatRepository}
          onClose={() => setChatRepository(null)}
        />
      )}

      {/* Analysis Report Modal */}
      <AnalysisReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Delete Confirmation Modal */}
      {pendingDeletion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => {
            if (deletingReportId === null && deletingRepositoryId === null) {
              setPendingDeletion(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-slate-700/80 bg-gradient-to-b from-[#131c2e] to-[#0d1424] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-500/10 p-3 text-red-400 border border-red-500/20">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-white">
                  {pendingDeletion.type === 'analysis' ? 'Delete Analysis Report?' : 'Delete Repository?'}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-200">{pendingDeletion.label}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeletion(null)}
                disabled={deletingReportId !== null || deletingRepositoryId !== null}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                No, keep it
              </button>
              <button
                type="button"
                onClick={confirmDeletion}
                disabled={deletingReportId !== null || deletingRepositoryId !== null}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-400 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deletingReportId !== null || deletingRepositoryId !== null ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
