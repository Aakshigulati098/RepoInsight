import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export default function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [diagramError, setDiagramError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      const container = containerRef.current;

      if (!container) return;

      container.innerHTML = '';
      setDiagramError('');

      if (typeof chart !== 'string' || !chart.trim()) return;

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
        });

        const id = `repo-diagram-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) {
          setDiagramError(
            'The diagram could not be rendered. Check the saved Mermaid source below.'
          );
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (typeof chart !== 'string' || !chart.trim()) {
    return (
      <p className="text-sm text-slate-500">
        No architecture diagram was saved in this report.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {diagramError && (
        <p className="text-sm text-amber-300">{diagramError}</p>
      )}

      <div
        ref={containerRef}
        className="min-h-8 overflow-x-auto rounded-lg bg-[#0b1120] p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      />

      <details className="rounded-lg border border-slate-800 p-3">
        <summary className="cursor-pointer text-sm text-emerald-300">
          View Mermaid source
        </summary>

        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-400">
          {chart}
        </pre>
      </details>
    </div>
  );
}
