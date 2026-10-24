import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Filter,
  FolderGit2,
  Grid,
  LayoutList,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
  GitFork,
} from 'lucide-react';
import RepositoryCard from '../../components/RepositoryCard.jsx';

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

export default function RepositoryList({
  repositories = [],
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
  onOpenImport,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('stars_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [refreshing, setRefreshing] = useState(false);

  // Extract all distinct languages
  const availableLanguages = useMemo(() => {
    const langs = new Set();
    for (const r of repositories) {
      if (r.language) langs.add(r.language);
    }
    return Array.from(langs).sort();
  }, [repositories]);

  // Filter and sort repositories
  const filteredRepositories = useMemo(() => {
    let result = [...repositories];

    // Search query filter (name, ownerName, description, topics)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const owner = (r.ownerName || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const lang = (r.language || '').toLowerCase();
        const topics = (r.topics || '').toLowerCase();
        return (
          name.includes(q) ||
          owner.includes(q) ||
          desc.includes(q) ||
          lang.includes(q) ||
          topics.includes(q)
        );
      });
    }

    // Language filter
    if (selectedLanguage !== 'ALL') {
      result = result.filter((r) => r.language === selectedLanguage);
    }

    // Indexing status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((r) => {
        const status = String(indexingStatuses[r.id]?.status || 'NOT_INDEXED').toUpperCase();
        if (selectedStatus === 'INDEXED') return status === 'COMPLETED';
        if (selectedStatus === 'IN_PROGRESS') return status === 'IN_PROGRESS' || status === 'PENDING';
        if (selectedStatus === 'NOT_INDEXED') return status === 'NOT_INDEXED';
        if (selectedStatus === 'FAILED') return status === 'FAILED';
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'stars_desc') {
        return (Number(b.stars) || 0) - (Number(a.stars) || 0);
      }
      if (sortBy === 'stars_asc') {
        return (Number(a.stars) || 0) - (Number(b.stars) || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'forks_desc') {
        return (Number(b.forks) || 0) - (Number(a.forks) || 0);
      }
      if (sortBy === 'id_desc') {
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      return 0;
    });

    return result;
  }, [repositories, searchQuery, selectedLanguage, selectedStatus, sortBy, indexingStatuses]);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  return (
    <section id="repositories" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-white">Repositories</h3>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-slate-700">
              {repositories.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Imported GitHub codebases with semantic vector indexing and AI reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/15 transition hover:bg-emerald-300"
            >
              <Plus size={15} />
              Import
            </button>
          )}

          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Refresh repositories"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#111928] to-[#0c1322] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by repository, @owner, description, topic, or language..."
              className="w-full rounded-xl border border-slate-700/80 bg-[#090f1b] pl-9 pr-9 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-emerald-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Language filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-[#090f1b] px-3 py-2 text-xs text-slate-300 outline-none focus:border-emerald-400"
            >
              <option value="ALL">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-700/80 bg-[#090f1b] px-3 py-2 text-xs text-slate-300 outline-none focus:border-emerald-400"
            >
              <option value="stars_desc">★ Most Stars</option>
              <option value="forks_desc">🍴 Most Forks</option>
              <option value="id_desc">Recently Added</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-slate-700/80 bg-[#090f1b] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'grid'
                    ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid view"
              >
                <Grid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table view"
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Indexing Status Pills Row */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-3">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter size={11} />
            Indexing:
          </span>

          {[
            { id: 'ALL', label: 'All' },
            { id: 'INDEXED', label: '✓ Ready for Q&A' },
            { id: 'IN_PROGRESS', label: '⚡ In Progress' },
            { id: 'NOT_INDEXED', label: 'Not Indexed' },
            { id: 'FAILED', label: 'Failed' },
          ].map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => setSelectedStatus(status.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                selectedStatus === status.id
                  ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-300'
              }`}
            >
              {status.label}
            </button>
          ))}

          {(searchQuery || selectedLanguage !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedLanguage('ALL');
                setSelectedStatus('ALL');
              }}
              className="ml-auto text-[11px] text-emerald-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area: Loading / Empty / Grid / Table */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-12 text-center">
          <LoaderCircle size={28} className="mx-auto animate-spin text-emerald-400" />
          <p className="mt-3 text-xs text-slate-400">Loading repositories from database...</p>
        </div>
      ) : repositories.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-12 text-center">
          <FolderGit2 size={36} className="mx-auto text-slate-600" />
          <h4 className="mt-3 text-sm font-bold text-white">No repositories found</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            You haven't imported any GitHub repositories yet. Enter a GitHub URL to start analyzing.
          </p>
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
            >
              <Plus size={15} />
              Import your first repository
            </button>
          )}
        </div>
      ) : filteredRepositories.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#090f1b] p-8 text-center">
          <Search size={28} className="mx-auto text-slate-600" />
          <h4 className="mt-2 text-sm font-bold text-white">No matching repositories</h4>
          <p className="mt-1 text-xs text-slate-400">
            No repositories matched your search or filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('ALL');
              setSelectedStatus('ALL');
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {filteredRepositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repo={repo}
              indexingStatus={indexingStatuses[repo.id]}
              isIndexing={indexingId === repo.id}
              isAnalyzing={analyzingId === repo.id}
              isDeleting={deletingRepositoryId === repo.id}
              onIndex={onIndex}
              onChat={onChat}
              onAnalyze={onAnalyze}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0c1322] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-[#090f1b] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Repository &amp; Owner</th>
                  <th className="px-4 py-3 font-semibold">Language</th>
                  <th className="px-4 py-3 font-semibold">Stars</th>
                  <th className="px-4 py-3 font-semibold">Forks</th>
                  <th className="px-4 py-3 font-semibold">Indexing Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRepositories.map((repo) => {
                  const owner = repo.ownerName || (repo.githubUrl ? repo.githubUrl.replace(/^https?:\/\/github\.com\//, '').split('/')[0] : 'Owner');
                  const avatar = repo.ownerAvatarUrl || (owner ? `https://github.com/${owner}.png` : null);
                  const indexing = indexingStatuses[repo.id] || {};
                  const status = String(indexing.status || 'NOT_INDEXED').toUpperCase();

                  return (
                    <tr key={repo.id} className="transition hover:bg-slate-800/30">
                      {/* Name & Owner */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={owner}
                              className="h-7 w-7 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 font-bold text-emerald-400 text-[10px]">
                              {owner.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-semibold text-white">
                              <span className="truncate">{repo.name}</span>
                              <a
                                href={repo.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-emerald-300"
                              >
                                <ArrowUpRight size={13} />
                              </a>
                            </div>
                            <span className="text-[11px] text-slate-400">@{owner}</span>
                          </div>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#94a3b8' }}
                          />
                          {repo.language || 'Plain text'}
                        </span>
                      </td>

                      {/* Stars */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Star size={12} className="text-amber-400 fill-amber-400/20" />
                          {Number(repo.stars || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Forks */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-400">
                          <GitFork size={12} />
                          {Number(repo.forks || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Indexing Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            status === 'COMPLETED'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : status === 'FAILED'
                              ? 'border-red-500/30 bg-red-500/10 text-red-300'
                              : status === 'IN_PROGRESS' || status === 'PENDING'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400'
                          }`}
                        >
                          {status === 'COMPLETED' && <CheckCircle2 size={10} />}
                          {status.replaceAll('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onChat(repo)}
                            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-1.5 text-cyan-300 hover:bg-cyan-500/20"
                            title="Ask code"
                          >
                            <MessageCircle size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAnalyze(repo.id)}
                            disabled={analyzingId === repo.id}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            title="Analyze"
                          >
                            <Sparkles size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onIndex(repo.id)}
                            disabled={indexingId === repo.id}
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                            title="Index"
                          >
                            <Database size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(repo.id, repo.name)}
                            disabled={deletingRepositoryId === repo.id}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
