import { useState } from 'react';
import { GitBranch, X, Plus, AlertCircle, LoaderCircle } from 'lucide-react';

export default function ImportRepositoryModal({
  isOpen,
  onClose,
  onImport,
  importing,
  error,
}) {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setLocalError('Please enter a GitHub repository URL.');
      return;
    }
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(trimmed)) {
      setLocalError('URL must match format: https://github.com/owner/repository');
      return;
    }

    setLocalError('');
    onImport(trimmed);
  };

  const handleExampleClick = (exampleUrl) => {
    setUrl(exampleUrl);
    setLocalError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-[#131c2e] to-[#0d1424] p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-500/20">
              <GitBranch size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import GitHub Repository</h3>
              <p className="text-xs text-slate-400">Ingest code, commits, and dependencies</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              GitHub Repository URL
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700/80 bg-[#090f1b] px-3.5 focus-within:border-emerald-400">
              <GitBranch size={16} className="text-slate-500 shrink-0" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setLocalError('');
                }}
                placeholder="https://github.com/owner/repository"
                className="w-full bg-transparent px-3 py-3 text-xs text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Errors */}
          {(localError || error) && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Example suggestions */}
          <div>
            <span className="text-[11px] text-slate-500">Popular open-source repositories to test:</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[
                'https://github.com/facebook/react',
                'https://github.com/spring-projects/spring-boot',
                'https://github.com/fastapi/fastapi',
                'https://github.com/pallets/flask',
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-slate-700 hover:text-emerald-300"
                >
                  {ex.replace('https://github.com/', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={importing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60"
            >
              {importing ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Import Repository
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
