function renderInline(text) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[0.9em] text-emerald-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

export default function MarkdownContent({ content }) {
  const lines = String(content ?? '').split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = [];
  let ordered = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-2">
        {renderInline(paragraph.join(' '))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    const List = ordered ? 'ol' : 'ul';
    blocks.push(
      <List
        key={`list-${blocks.length}`}
        className={`my-3 space-y-1.5 pl-6 ${ordered ? 'list-decimal' : 'list-disc'}`}
      >
        {list.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </List>
    );
    list = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);

    if (bullet || numbered) {
      flushParagraph();
      const isOrdered = Boolean(numbered);
      if (list.length && ordered !== isOrdered) flushList();
      ordered = isOrdered;
      list.push((bullet || numbered)[1]);
      return;
    }

    flushList();
    if (!trimmed) {
      flushParagraph();
      return;
    }

    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const Heading = level <= 2 ? 'h3' : 'h4';
      blocks.push(
        <Heading
          key={`h-${blocks.length}`}
          className={`mt-5 font-semibold text-slate-100 ${level <= 2 ? 'text-base' : 'text-sm'}`}
        >
          {renderInline(heading[2])}
        </Heading>
      );
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      blocks.push(
        <hr key={`hr-${blocks.length}`} className="my-4 border-slate-700" />
      );
      return;
    }

    paragraph.push(trimmed);
  });

  flushList();
  flushParagraph();

  return (
    <div className="text-sm leading-7 text-slate-300">
      {blocks}
    </div>
  );
}
