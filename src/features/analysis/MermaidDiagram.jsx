import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

function buildEvidenceFallback(technologies, importantFiles) {
  const safeLabels = (items) => (Array.isArray(items) ? items : [])
    .filter((item) => typeof item === 'string' && item.trim())
    .slice(0, 5)
    .map((item) => item
      .replace(/[\r\n]+/g, ' ')
      .replace(/["[\]{}()<>|#;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80))
    .filter(Boolean);

  const detectedTechnologies = safeLabels(technologies);
  const detectedFiles = safeLabels(importantFiles);
  const lines = [
    'flowchart TD',
    '  A["Repository"]',
  ];

  if (detectedTechnologies.length) {
    lines.push('  B["Detected technologies"]', '  A --> B');
    detectedTechnologies.forEach((technology, index) => {
      const id = `T${index}`;
      lines.push(`  ${id}["${technology}"]`, `  B --> ${id}`);
    });
  }

  if (detectedFiles.length) {
    lines.push('  C["Important project files"]', '  A --> C');
    detectedFiles.forEach((file, index) => {
      const id = `F${index}`;
      lines.push(`  ${id}["${file}"]`, `  C --> ${id}`);
    });
  }

  return lines.join('\n');
}

export default function MermaidDiagram({
  chart,
  technologies = [],
  importantFiles = [],
}) {
  const containerRef = useRef(null);
  const [diagramError, setDiagramError] = useState('');
  const technologyKey = technologies.join('\n');
  const importantFilesKey = importantFiles.join('\n');

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
          const fallback = buildEvidenceFallback(
            technologyKey ? technologyKey.split('\n') : [],
            importantFilesKey ? importantFilesKey.split('\n') : []
          );
          try {
            const { svg } = await mermaid.render(
              `repo-diagram-fallback-${Date.now()}`,
              fallback
            );
            if (!cancelled && containerRef.current) {
              containerRef.current.innerHTML = svg;
              setDiagramError(
                'The generated diagram could not be rendered. Showing a diagram based on detected technologies and project files instead.'
              );
            }
          } catch {
            if (!cancelled) {
              setDiagramError(
                'The generated diagram could not be rendered. Check the saved Mermaid source below.'
              );
            }
          }
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, technologyKey, importantFilesKey]);

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
