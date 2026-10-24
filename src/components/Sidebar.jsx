import {
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  MessageSquareCode,
  Plus,
  GitFork,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onTabChange,
  repositoryCount = 0,
  reportCount = 0,
  indexedCount = 0,
  onOpenImport,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Workspace overview',
    },
    {
      id: 'repositories',
      label: 'Repositories',
      icon: FolderGit2,
      badge: repositoryCount,
      desc: 'Codebases & Q&A setup',
    },
    {
      id: 'analysis',
      label: 'AI Analysis',
      icon: Sparkles,
      badge: reportCount,
      desc: 'Architecture audits',
    },
    {
      id: 'chat',
      label: 'Code Q&A',
      icon: MessageSquareCode,
      badge: indexedCount > 0 ? `${indexedCount} ready` : null,
      badgeColor: 'emerald',
      desc: 'Semantic codebase chat',
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-slate-800/80 bg-[#0a101d] p-5 md:flex z-30">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20">
            <GitFork size={22} className="stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                RepoInsight
              </h1>
              <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Codebase Intelligence
            </p>
          </div>
        </div>

        {/* Quick Import Action */}
        <div className="mt-6 px-1">
          <button
            type="button"
            onClick={onOpenImport}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/15 transition-all duration-200 hover:from-emerald-300 hover:to-emerald-400 hover:shadow-emerald-500/25 active:scale-[0.98]"
          >
            <Plus size={16} className="transition-transform group-hover:rotate-90" />
            Import Repository
          </button>
        </div>

        {/* Navigation Section */}
        <div className="mt-8">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <nav className="mt-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-500/20 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}
                    />
                    <div>
                      <div className="font-semibold leading-tight">{item.label}</div>
                    </div>
                  </div>

                  {item.badge != null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.badgeColor === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isActive
                          ? 'bg-emerald-400/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute -left-5 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status footer */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#101726] to-[#0c1322] p-3.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            System Active
          </span>
          <span className="text-[10px] text-slate-500">AI Engine</span>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          RAG embeddings and Kafka analysis workers connected.
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-500">
          <span>Spring AI & pgvector</span>
          <span className="font-mono text-emerald-400">ready</span>
        </div>
      </div>
    </aside>
  );
}
