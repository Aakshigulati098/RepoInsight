import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  Bot,
  Clock3,
  FileCode2,
  LoaderCircle,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  createRepositoryChat,
  getChatMessages,
  listRepositoryChats,
  sendChatMessage,
} from '../service/api.js';

function normalizeChat(chat) {
  const hasMessages = Array.isArray(chat.messages);
  return {
    ...chat,
    id: chat.id ?? chat.chatId,
    title: chat.title || 'New conversation',
    messages: hasMessages ? chat.messages : [],
    messagesLoaded: hasMessages,
    updatedAt: chat.updatedAt || chat.createdAt || null,
  };
}

function formatDate(value) {
  return typeof value === 'string' && value.length >= 10
    ? value.slice(0, 10)
    : 'Recently';
}


function renderInlineMarkdown(text) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[0.9em] text-emerald-200">{token.slice(1, -1)}</code>;
    }
    return token;
  });
}

function renderMessageMarkdown(content) {
  const lines = String(content ?? '').split(/\r?\n/);
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5">
          {listItems.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      return;
    }

    flushList();
    if (!trimmed) {
      blocks.push(<div key={`space-${index}`} className="h-2" />);
    } else if (trimmed.startsWith('### ')) {
      blocks.push(<h4 key={index} className="mt-3 font-semibold text-slate-100">{renderInlineMarkdown(trimmed.slice(4))}</h4>);
    } else if (trimmed.startsWith('## ')) {
      blocks.push(<h3 key={index} className="mt-3 font-semibold text-slate-100">{renderInlineMarkdown(trimmed.slice(3))}</h3>);
    } else if (trimmed.startsWith('# ')) {
      blocks.push(<h3 key={index} className="mt-3 text-base font-semibold text-slate-100">{renderInlineMarkdown(trimmed.slice(2))}</h3>);
    } else {
      blocks.push(<p key={index} className="my-1">{renderInlineMarkdown(trimmed)}</p>);
    }
  });
  flushList();
  return blocks;
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const sources = Array.isArray(message.sources) ? message.sources : [];

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
          <Bot size={17} />
        </div>
      )}
      <div className={`max-w-[88%] min-w-0 rounded-2xl px-4 py-3 ${isUser ? 'bg-emerald-400 text-slate-950' : 'border border-slate-800 bg-[#111b2e] text-slate-200'}`}>
        <div className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${isUser ? 'text-slate-800/70' : 'text-emerald-300'}`}>
          {isUser ? 'You' : 'RepoInsight AI'}
        </div>
        <div className="break-words text-sm leading-6 [&_p]:whitespace-pre-wrap">{renderMessageMarkdown(message.content)}</div>
        {!isUser && sources.length > 0 && (
          <div className="mt-4 border-t border-slate-700/80 pt-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <FileCode2 size={13} /> Source files
            </div>
            <div className="flex flex-col gap-1.5">
              {sources.map((source, index) => {
                const label = typeof source === 'string'
                  ? source
                  : source?.filePath ?? source?.metadata?.filePath ?? `Source ${index + 1}`;
                return (
                  <span
                    key={`${label}-${index}`}
                    title={label}
                    className="block w-full max-w-full break-all rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 font-mono text-[11px] leading-5 text-cyan-200"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-xs font-bold text-slate-200">
          You
        </div>
      )}
    </div>
  );
}

export default function RepositoryChatModal({ repository, onClose }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeChat = chats.find((chat) => String(chat.id) === String(activeChatId)) ?? null;
  const messages = activeChat?.messages ?? [];
  const filteredChats = useMemo(
    () => chats.filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setError('');
      setChats([]);
      setActiveChatId(null);

      try {
        const response = await listRepositoryChats(repository.id);
        if (!Array.isArray(response)) {
          throw new Error('Unexpected response while loading chat history.');
        }
        if (cancelled) return;

        const savedChats = response.map(normalizeChat);
        setChats(savedChats);
        if (savedChats.length > 0) {
          const firstChat = savedChats[0];
          setActiveChatId(firstChat.id);

          const savedMessages = await getChatMessages(firstChat.id);
          if (!Array.isArray(savedMessages)) {
            throw new Error('Unexpected response while loading chat messages.');
          }
          if (cancelled) return;

          setChats((current) => current.map((chat) =>
            String(chat.id) === String(firstChat.id)
              ? { ...chat, messages: savedMessages, messagesLoaded: true }
              : chat
          ));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load chat history.');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [repository.id]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [loading, onClose]);

  function startNewChat() {
    if (loading || historyLoading) return;
    setActiveChatId(null);
    setQuestion('');
    setError('');
  }

  async function openChat(chatId) {
    if (loading) return;
    setActiveChatId(chatId);
    setError('');

    const existing = chats.find((chat) => String(chat.id) === String(chatId));
    if (existing?.messagesLoaded) return;

    setLoading(true);
    try {
      const savedMessages = await getChatMessages(chatId);
      if (!Array.isArray(savedMessages)) {
        throw new Error('Unexpected response while loading chat messages.');
      }
      setChats((current) => current.map((chat) =>
        String(chat.id) === String(chatId)
          ? { ...chat, messages: savedMessages, messagesLoaded: true }
          : chat
      ));
    } catch (err) {
      setError(err.message || 'Unable to load this conversation.');
    } finally {
      setLoading(false);
    }
  }

  async function submitQuestion(event) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || loading) return;

    setError('');
    setLoading(true);

    try {
      let chatId = activeChatId;
      let result;

      if (activeChat) {
        result = await sendChatMessage(activeChat.id, prompt);
      } else {
        result = await createRepositoryChat(repository.id, prompt);
        chatId = result?.id ?? result?.chatId;
        if (chatId == null) {
          throw new Error('The server did not return an ID for the new chat.');
        }
      }

      let savedMessages = result?.messages;
      if (!Array.isArray(savedMessages)) {
        savedMessages = await getChatMessages(chatId);
      }
      if (!Array.isArray(savedMessages)) {
        throw new Error('Unexpected response while loading chat messages.');
      }

      const previousChat = chats.find((chat) => String(chat.id) === String(chatId));
      const updatedChat = normalizeChat({
        ...previousChat,
        ...result,
        id: chatId,
        title: result?.title || previousChat?.title || prompt,
        messages: savedMessages,
        updatedAt: result?.updatedAt || previousChat?.updatedAt || null,
      });

      setChats((current) => [
        updatedChat,
        ...current.filter((chat) => String(chat.id) !== String(chatId)),
      ]);
      setActiveChatId(chatId);
      setQuestion('');
    } catch (err) {
      setError(err.message || 'Unable to ask a question about this repository.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/85 p-2 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="repository-chat-title"
        className="flex h-[min(860px,94vh)] w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-700/90 bg-[#0b1120] shadow-2xl shadow-black/50"
      >
        {sidebarOpen && (
          <aside className="flex w-[270px] shrink-0 flex-col border-r border-slate-800 bg-[#0d1527] max-sm:absolute max-sm:inset-y-2 max-sm:left-2 max-sm:z-10 max-sm:rounded-l-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 size={16} className="text-emerald-300" /> Chat history
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Hide history"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            <div className="p-3">
              <button
                onClick={startNewChat}
                disabled={loading || historyLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} /> New chat
              </button>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-[#080e1b] px-3">
                <Search size={14} className="shrink-0 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
              {historyLoading ? (
                <div className="px-3 py-8 text-center text-xs text-slate-500">Loading conversations...</div>
              ) : filteredChats.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <MessageCircle size={22} className="mx-auto text-slate-600" />
                  <p className="mt-2 text-xs text-slate-500">No previous chats yet.</p>
                  <p className="mt-1 text-[11px] text-slate-600">Your conversations will appear here.</p>
                </div>
              ) : filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  disabled={loading}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${String(chat.id) === String(activeChatId) ? 'border border-emerald-400/20 bg-emerald-400/10' : 'border border-transparent hover:bg-slate-800/70'} disabled:cursor-not-allowed`}
                >
                  <div className="truncate text-sm font-medium text-slate-200">{chat.title}</div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>{chat.messagesLoaded ? `${chat.messages.length} messages` : 'Conversation'}</span>
                    <span>{formatDate(chat.updatedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">Saved to your database</div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Show history"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Repository intelligence
              </div>
              <h2 id="repository-chat-title" className="mt-0.5 truncate text-base font-semibold text-slate-100">
                {repository.name}
              </h2>
              <p className="truncate text-xs text-slate-500">
                {repository.githubUrl ?? 'Ask questions about this repository’s source code'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              aria-label="Close repository chat"
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
            {historyLoading ? (
              <div className="mx-auto flex min-h-full items-center justify-center text-sm text-slate-400">
                <LoaderCircle size={17} className="mr-2 animate-spin text-emerald-300" /> Loading chat history…
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <MessageCircle size={25} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-100">Understand your codebase</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Ask about request flows, key classes, dependencies, or how a feature works. RepoInsight will return an answer with source-file references.
                </p>
                <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {[
                    'Explain the project structure',
                    'Where is authentication handled?',
                    'Trace a request through the layers',
                    'Which files configure the database?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuestion(suggestion)}
                      className="rounded-xl border border-slate-800 bg-[#111b2e]/70 p-3 text-left text-xs text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
                    >
                      {suggestion}<span className="ml-2 text-emerald-300">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message, index) => (
                  <ChatMessage key={message.id ?? `${message.createdAt}-${index}`} message={message} />
                ))}
                {loading && (
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <LoaderCircle size={17} className="animate-spin text-emerald-300" />
                    Inspecting repository files and preparing an answer…
                  </div>
                )}
              </div>
            )}
            {error && (
              <div role="alert" className="mx-auto mt-4 max-w-3xl rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 bg-[#0d1527]/80 px-4 py-4 sm:px-6">
            <form onSubmit={submitQuestion} className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-700 bg-[#080e1b] p-2 transition focus-within:border-emerald-400/50 focus-within:ring-2 focus-within:ring-emerald-400/10">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={2}
                  maxLength={1500}
                  placeholder="Ask a question about the codebase… (Enter to send, Shift+Enter for new line)"
                  className="max-h-36 min-h-[56px] w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-[10px] text-slate-600">
                    Answers can be imperfect — verify important details against source code.
                  </span>
                  <button
                    type="submit"
                    disabled={loading || !question.trim() || historyLoading}
                    className="flex items-center gap-2 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUp size={15} />}
                    {loading ? 'Thinking' : 'Ask'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
