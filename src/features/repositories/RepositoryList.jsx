
import {
  Code2,
  ArrowUpRight,
  Star,
  Sparkles,
  GitBranch,
  Trash2,
  MessageCircle,
  Database,
  LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function RepositoryList({
  repositories,
  loading,
  importing,
  analyzingId,
  deletingRepositoryId,
  indexingStatuses = {},
  indexingId = null,
  onIndex,
  onAnalyze,
  onChat,
  onDelete,
  onRefresh,
}) {
  const [refreshAnimation, setRefreshAnimation] = useState(0);

  return (
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
          onClick={() => {
            setRefreshAnimation((animation) => animation + 1);
            onRefresh();
          }}
          disabled={loading}
          className="text-sm text-emerald-300 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            Loading repositories...
          </p>
        ) : repositories.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 text-center">
            <GitBranch
              className="mx-auto text-slate-500"
              size={32}
            />

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
                      <Code2
                        size={21}
                        className="text-emerald-300"
                      />
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

                {(() => {
                  const indexing = indexingStatuses[repo.id] || {};
                  const status = String(indexing.status || 'NOT_INDEXED').toUpperCase();
                  const progress = Math.max(0, Math.min(100, Number(indexing.progress || 0)));
                  const active = status === 'IN_PROGRESS' || status === 'PENDING';
                  const statusClass = status === 'COMPLETED'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : status === 'FAILED'
                      ? 'border-red-500/30 bg-red-500/10 text-red-300'
                      : active
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400';

                  return (
                    <div className="mb-4 rounded-lg border border-slate-800 bg-[#0b1424] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <Database size={15} className="text-emerald-300" />
                          Code indexing
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass}`}>
                          {status.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${status === 'FAILED' ? 'bg-red-400' : 'bg-emerald-400'}`}
                          style={{ width: `${status === 'COMPLETED' ? 100 : progress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>{indexing.error ? indexing.error : active ? 'Indexing in the background…' : status === 'COMPLETED' ? 'Ready for code Q&A' : 'Index the source code to enable code Q&A'}</span>
                        <span className="shrink-0">{status === 'COMPLETED' ? 100 : progress}%</span>
                      </div>
                      {status === 'COMPLETED' && indexing.chunksIndexed != null && (
                        <p className="mt-1 text-xs text-slate-500">{indexing.chunksIndexed} chunks indexed</p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-300" />
                    {repo.language || 'Not detected'}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Star size={14} />
                    {repo.stars == null
                      ? 'N/A'
                      : Number(repo.stars).toLocaleString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => onIndex(repo.id)}
                    disabled={importing || indexingId !== null || indexingStatuses[repo.id]?.status === 'IN_PROGRESS' || indexingStatuses[repo.id]?.status === 'PENDING' || analyzingId !== null || deletingRepositoryId !== null}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 px-3 py-1.5 text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {indexingId === repo.id || ['IN_PROGRESS', 'PENDING'].includes(String(indexingStatuses[repo.id]?.status || '').toUpperCase())
                      ? <LoaderCircle size={13} className="animate-spin" />
                      : <Database size={13} />}
                    {indexingId === repo.id || ['IN_PROGRESS', 'PENDING'].includes(String(indexingStatuses[repo.id]?.status || '').toUpperCase()) ? 'Indexing…' : 'Index code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onChat(repo)}
                    disabled={importing || analyzingId !== null || deletingRepositoryId !== null}
                    className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MessageCircle size={13} />
                    Ask code
                  </button>
                  <button
                    type="button"
                    onClick={() => onAnalyze(repo.id)}
                    disabled={
                      importing ||
                      analyzingId !== null ||
                      deletingRepositoryId !== null
                    }
                    className="ml-auto rounded-full bg-emerald-400/10 px-3 py-1.5 text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} />
                      {analyzingId === repo.id
                        ? 'Analyzing...'
                        : 'Analyze'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(repo.id, repo.name)}
                    disabled={
                      importing ||
                      analyzingId !== null ||
                      deletingRepositoryId !== null
                    }
                    aria-label={`Delete repository ${repo.name}`}
                    className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-red-300 hover:border-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {deletingRepositoryId === repo.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
