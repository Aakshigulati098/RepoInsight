
import {
  Code2,
  ArrowUpRight,
  Star,
  Sparkles,
  GitBranch,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function RepositoryList({
  repositories,
  loading,
  importing,
  analyzingId,
  deletingRepositoryId,
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
