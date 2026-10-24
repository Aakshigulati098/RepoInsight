import { useState, useMemo } from 'react';
import {
  MessageSquareCode,
  FolderGit2,
  Database,
  ArrowRight,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';

export default function ChatWorkspaceView({
  repositories = [],
  indexingStatuses = {},
  onSelectRepoForChat,
  onIndexRepo,
  indexingId,
}) {
  const [selectedRepoId, setSelectedRepoId] = useState(
    repositories[0]?.id || ''
  );

  const indexedRepos = useMemo(() => {
    return repositories.filter(
      (r) => String(indexingStatuses[r.id]?.status || '').toUpperCase() === 'COMPLETED'
    );
  }, [repositories, indexingStatuses]);

  const selectedRepo = useMemo(() => {
    return repositories.find((r) => String(r.id) === String(selectedRepoId)) || repositories[0];
  }, [repositories, selectedRepoId]);

  const selectedRepoStatus = selectedRepo
    ? String(indexingStatuses[selectedRepo.id]?.status || 'NOT_INDEXED').toUpperCase()
    : 'NOT_INDEXED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-bold text-white">Codebase Q&amp;A Workspace</h3>
          <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
            Spring AI + pgvector
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Ask questions, trace architecture patterns, and debug code across your indexed repositories.
        </p>
      </div>

      {repositories.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-12 text-center">
          <FolderGit2 size={36} className="mx-auto text-slate-600" />
          <h4 className="mt-3 text-sm font-bold text-white">No repositories available</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Import a public GitHub repository first to start questioning the codebase.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Repository Selection & Status */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Repository
            </h4>

            <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {repositories.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;
                const status = String(indexingStatuses[repo.id]?.status || 'NOT_INDEXED').toUpperCase();
                const isIndexed = status === 'COMPLETED';

                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => setSelectedRepoId(repo.id)}
                    className={`flex w-full items-start justify-between rounded-xl p-3 text-left transition border ${
                      isSelected
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-white'
                        : 'border-slate-800/80 bg-[#090f1b] text-slate-300 hover:border-slate-700 hover:bg-[#0d1526]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs truncate">
                        {repo.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        @{repo.ownerName || 'owner'} · {repo.language || 'Code'}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                        isIndexed
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : status === 'IN_PROGRESS' || status === 'PENDING'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isIndexed ? 'Indexed' : status === 'IN_PROGRESS' ? 'Indexing...' : 'Not indexed'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Workspace Launch Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-6 lg:col-span-2 flex flex-col justify-between">
            {selectedRepo ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400">
                      Active Repository Q&amp;A
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {selectedRepo.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedRepo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-cyan-400">
                    <Bot size={24} />
                  </div>
                </div>

                {/* Indexing Readiness Status Box */}
                <div className="mt-6 rounded-xl border border-slate-800 bg-[#090f1b] p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Database size={15} className="text-emerald-400" />
                      Vector Indexing Status
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        selectedRepoStatus === 'COMPLETED'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : selectedRepoStatus === 'FAILED'
                          ? 'border-red-500/30 bg-red-500/10 text-red-300'
                          : selectedRepoStatus === 'IN_PROGRESS' || selectedRepoStatus === 'PENDING'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {selectedRepoStatus === 'COMPLETED' && <CheckCircle2 size={11} />}
                      {selectedRepoStatus}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {selectedRepoStatus === 'COMPLETED'
                      ? 'Source files have been chunked, converted to embeddings with nomic-embed-text, and stored in pgvector. You can ask any architectural or implementation questions!'
                      : selectedRepoStatus === 'IN_PROGRESS' || selectedRepoStatus === 'PENDING'
                      ? 'Indexing is currently running in the background. Chunks are being extracted and embedded.'
                      : 'This repository has not been indexed yet. Index it first so the AI model has full semantic context of all files.'}
                  </p>

                  {selectedRepoStatus !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => onIndexRepo(selectedRepo.id)}
                      disabled={indexingId === selectedRepo.id || selectedRepoStatus === 'IN_PROGRESS'}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                    >
                      {indexingId === selectedRepo.id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Database size={14} />
                      )}
                      Index {selectedRepo.name} Now
                    </button>
                  )}
                </div>

                {/* Example prompts */}
                <div className="mt-6">
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Suggested Questions
                  </h5>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    {[
                      'How is authentication handled in this project?',
                      'Explain the project structure and main services.',
                      'What external APIs and databases are configured?',
                      'Where are the Kafka consumer/producers implemented?',
                    ].map((prompt) => (
                      <div
                        key={prompt}
                        onClick={() => onSelectRepoForChat(selectedRepo)}
                        className="cursor-pointer rounded-xl border border-slate-800/80 bg-[#090f1b] p-3 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:bg-[#0c1527] hover:text-cyan-300"
                      >
                        "{prompt}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Launch Chat Button */}
            {selectedRepo && (
              <div className="mt-8 border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => onSelectRepoForChat(selectedRepo)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-blue-400 active:scale-98"
                >
                  <MessageSquareCode size={16} />
                  Open Interactive Q&amp;A Session for {selectedRepo.name}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
