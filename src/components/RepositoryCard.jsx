import { useState } from 'react';
import {
  ArrowUpRight,
  Code2,
  Database,
  GitFork,
  LoaderCircle,
  MessageCircle,
  Sparkles,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Shield,
  CircleDot,
} from 'lucide-react';

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

export default function RepositoryCard({
  repo,
  indexingStatus,
  isIndexing,
  isAnalyzing,
  isDeleting,
  onIndex,
  onChat,
  onAnalyze,
  onDelete,
}) {
  const [avatarError, setAvatarError] = useState(false);

  // Derive owner details
  const ownerName = repo.ownerName || (repo.githubUrl ? repo.githubUrl.replace(/^https?:\/\/github\.com\//, '').split('/')[0] : 'Repository');
  const ownerAvatar = !avatarError && (repo.ownerAvatarUrl || (ownerName ? `https://github.com/${ownerName}.png` : null));
  const ownerUrl = repo.ownerUrl || (ownerName ? `https://github.com/${ownerName}` : repo.githubUrl);

  // Indexing status
  const status = String(indexingStatus?.status || 'NOT_INDEXED').toUpperCase();
  const progress = Math.max(0, Math.min(100, Number(indexingStatus?.progress || 0)));
  const isActiveIndexing = status === 'IN_PROGRESS' || status === 'PENDING' || isIndexing;

  // Language color
  const langColor = LANGUAGE_COLORS[repo.language] || '#94a3b8';

  // Topic list
  const topics = Array.isArray(repo.topics)
    ? repo.topics
    : typeof repo.topics === 'string' && repo.topics.trim().length > 0
    ? repo.topics.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-5 shadow-lg backdrop-blur transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-500/5">
      <div>
        {/* Header: Owner Avatar & Info + External Link */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Owner Avatar */}
            <a
              href={ownerUrl}
              target="_blank"
              rel="noreferrer"
              className="relative shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-0.5 transition-transform hover:scale-105"
              title={`View ${ownerName} on GitHub`}
            >
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  onError={() => setAvatarError(true)}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 font-bold text-emerald-400">
                  {ownerName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </a>

            {/* Title & Owner Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <a
                  href={ownerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-emerald-300 hover:underline"
                >
                  @{ownerName}
                </a>
                <span className="text-slate-600">/</span>
                <span className="text-[10px] text-slate-500 font-mono">#{repo.id}</span>
              </div>
              <h4 className="truncate text-base font-bold text-white transition-colors group-hover:text-emerald-300">
                {repo.name}
              </h4>
            </div>
          </div>

          {/* GitHub External Link */}
          <a
            href={repo.githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${repo.name} on GitHub`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-emerald-300"
            title="Open on GitHub"
          >
            <ArrowUpRight size={17} />
          </a>
        </div>

        {/* Description */}
        <p className="mt-3.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-400">
          {repo.description || 'No description provided for this repository.'}
        </p>

        {/* Topics Chips */}
        {topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
              >
                #{topic}
              </span>
            ))}
            {topics.length > 4 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{topics.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Indexing Status Box */}
        <div className="mt-4 rounded-xl border border-slate-800/90 bg-[#090f1c] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-medium text-slate-300">
              <Database size={14} className={isActiveIndexing ? 'text-amber-400 animate-pulse' : 'text-emerald-400'} />
              Code indexing
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                status === 'COMPLETED'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : status === 'FAILED'
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : isActiveIndexing
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse'
                  : 'border-slate-700/80 bg-slate-800/60 text-slate-400'
              }`}
            >
              {isActiveIndexing && <LoaderCircle size={10} className="animate-spin" />}
              {status === 'COMPLETED' && <CheckCircle2 size={10} />}
              {status === 'FAILED' && <AlertCircle size={10} />}
              {status.replaceAll('_', ' ')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'FAILED'
                  ? 'bg-red-400'
                  : isActiveIndexing
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${status === 'COMPLETED' ? 100 : progress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate pr-2">
              {indexingStatus?.error
                ? indexingStatus.error
                : isActiveIndexing
                ? 'Indexing code chunks into pgvector...'
                : status === 'COMPLETED'
                ? 'Indexed & ready for semantic Q&A'
                : 'Index code to unlock conversational AI'}
            </span>
            <span className="shrink-0 font-medium text-slate-400">
              {status === 'COMPLETED' ? '100%' : `${progress}%`}
            </span>
          </div>

          {status === 'COMPLETED' && indexingStatus?.chunksIndexed != null && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400/80">
              <CheckCircle2 size={11} />
              <span>{indexingStatus.chunksIndexed} chunks indexed</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Area: Metadata + Action Buttons */}
      <div className="mt-5 border-t border-slate-800/80 pt-4">
        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          {/* Language */}
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: langColor }}
            />
            {repo.language || 'Plain text'}
          </span>

          {/* Stars */}
          <span className="flex items-center gap-1 hover:text-amber-300" title="Stars">
            <Star size={13} className="text-amber-400 fill-amber-400/20" />
            {Number(repo.stars || 0).toLocaleString()}
          </span>

          {/* Forks */}
          {repo.forks != null && repo.forks > 0 && (
            <span className="flex items-center gap-1 text-slate-400" title="Forks">
              <GitFork size={13} className="text-slate-400" />
              {Number(repo.forks).toLocaleString()}
            </span>
          )}

          {/* Open Issues */}
          {repo.openIssues != null && repo.openIssues > 0 && (
            <span className="flex items-center gap-1 text-slate-400" title="Open Issues">
              <CircleDot size={13} className="text-slate-500" />
              {Number(repo.openIssues).toLocaleString()}
            </span>
          )}

          {/* License */}
          {repo.license && (
            <span className="ml-auto flex items-center gap-1 rounded bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700/60" title={`License: ${repo.license}`}>
              <Shield size={11} />
              {repo.license}
            </span>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Ask Code */}
          <button
            type="button"
            onClick={() => onChat(repo)}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-400 disabled:opacity-50"
            title="Chat with repository codebase"
          >
            <MessageCircle size={14} />
            Ask code
          </button>

          {/* AI Analysis */}
          <button
            type="button"
            onClick={() => onAnalyze(repo.id)}
            disabled={isAnalyzing || isDeleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-400/10 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-400/20 hover:border-emerald-400 disabled:opacity-50"
            title="Run AI architecture analysis"
          >
            {isAnalyzing ? (
              <LoaderCircle size={14} className="animate-spin text-emerald-400" />
            ) : (
              <Sparkles size={14} />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>

          {/* Re-Index */}
          <button
            type="button"
            onClick={() => onIndex(repo.id)}
            disabled={isActiveIndexing || isDeleting}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Re-index codebase embeddings"
          >
            <Database size={14} className={isActiveIndexing ? 'animate-spin text-amber-400' : ''} />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(repo.id, repo.name)}
            disabled={isDeleting}
            className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-400 transition hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
            title={`Delete ${repo.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
