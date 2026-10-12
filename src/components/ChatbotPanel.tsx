import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SampleStock } from '../types/trading';
import { 
  Send, 
  User, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { CandlestickLogo } from './CandlestickLogo';

interface ChatbotPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedStock: SampleStock;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onRetryLast: () => void;
}

const CANDLESTICK_AI_QUESTIONS = [
  'Analyze Nifty 50 trend and key support levels',
  'What is the RSI of Reliance on NSE and what does it indicate?',
  'How do 20-day & 50-day SMAs work for Indian swing trading?',
  'Explain how to set an intraday stop-loss on NSE',
  'How do I read candlestick wicks and rejection signals?',
  'What is the difference between Nifty 50 and Bank Nifty?',
];

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({
  messages,
  isLoading,
  error,
  selectedStock,
  onSendMessage,
  onClearChat,
  onRetryLast,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-cyan-300 text-sm mt-2 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-semibold text-emerald-300 text-xs mt-2 mb-0.5">
                {trimmed.replace('#### ', '')}
              </h5>
            );
          }
          if (trimmed.startsWith('💡 ') || trimmed.startsWith('**💡 ')) {
            return (
              <div
                key={idx}
                className="bg-[#0b222d] border border-cyan-500/30 rounded-lg p-2.5 my-2 text-cyan-200 text-xs shadow-sm"
              >
                {trimmed}
              </div>
            );
          }
          if (trimmed.startsWith('⚠️ ') || trimmed.startsWith('**⚠️ ')) {
            return (
              <div
                key={idx}
                className="bg-[#241315] border border-rose-500/30 rounded-lg p-2.5 my-2 text-rose-200 text-xs"
              >
                {trimmed}
              </div>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-cyan-400 mt-1 font-bold">•</span>
                <span>{renderInlineFormatting(trimmed.substring(2))}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            const match = trimmed.match(/^(\d+\.)\s(.*)/);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 font-mono font-bold">{match?.[1]}</span>
                <span>{renderInlineFormatting(match?.[2] || '')}</span>
              </div>
            );
          }
          if (trimmed === '') {
            return <div key={idx} className="h-1" />;
          }

          return <p key={idx}>{renderInlineFormatting(trimmed)}</p>;
        })}
      </div>
    );
  };

  const renderInlineFormatting = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="bg-[#0b1933] text-cyan-300 font-mono px-1 py-0.5 rounded text-[11px] border border-cyan-900/50"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-[#070e1e] border border-[#162544] rounded-xl flex flex-col h-[700px] overflow-hidden shadow-xl shadow-black/50">
      {/* Chatbot Header */}
      <div className="p-3.5 border-b border-[#162544] bg-[#09142b] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CandlestickLogo size={34} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Candlestick AI Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300">
              Grounded on <span className="text-cyan-400 font-mono font-semibold">{selectedStock.symbol}</span> ({selectedStock.exchange || 'NSE'}) live & historical signals
            </p>
          </div>
        </div>

        <button
          onClick={onClearChat}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#122244] rounded-lg transition"
          title="Clear Conversation History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Questions Pills Bar */}
      <div className="px-3 py-2 bg-[#050b18] border-b border-[#142340] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] uppercase font-bold text-cyan-400/80 tracking-wider whitespace-nowrap flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Signals:
        </span>
        {CANDLESTICK_AI_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(q)}
            disabled={isLoading}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#0b1730] hover:bg-[#12254d] text-slate-300 hover:text-cyan-200 border border-[#1b2f57] transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#070e1e]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="shrink-0 mt-0.5">
                  <CandlestickLogo size={28} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-none shadow-md shadow-emerald-950/40'
                    : msg.isError
                    ? 'bg-[#261015] border border-rose-500/40 text-rose-200 rounded-tl-none'
                    : 'bg-[#0d1832] border border-[#1b2b4d] text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Context badge */}
                {msg.contextStock && !isUser && (
                  <div className="mb-1.5 pb-1 border-b border-[#1b2b4d] text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Market signal context: {msg.contextStock}
                  </div>
                )}

                {/* Message Body */}
                {isUser ? (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}

                {/* Follow-up Question Chips for Assistant Responses */}
                {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#1b2b4d]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Explore Next:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => onSendMessage(fu)}
                          disabled={isLoading}
                          className="text-[11px] text-left px-2 py-1 rounded bg-[#071124] hover:bg-[#0c1c38] text-cyan-300 hover:text-cyan-100 border border-cyan-500/20 transition flex items-center gap-1"
                        >
                          <HelpCircle className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{fu}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer timestamp & copy button */}
                <div
                  className={`flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] ${
                    isUser ? 'text-emerald-200/80' : 'text-slate-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-slate-300"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#142340] border border-[#233860] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-emerald-300" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator State */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="shrink-0 animate-spin">
              <CandlestickLogo size={28} />
            </div>
            <div className="bg-[#0d1832] border border-[#1b2b4d] rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
              <span className="text-xs text-slate-300">Reading the market & analyzing candlestick patterns</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-[#241216] border border-rose-500/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={onRetryLast}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded border border-rose-500/40 transition shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-[#081124] border-t border-[#162544]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Candlestick AI: 'Read Nifty 50 signals', 'Analyze Reliance RSI & SMAs'... (Enter to send)"
              className="w-full bg-[#0c162e] border border-[#1b2b4d] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white rounded-xl font-medium transition flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="text-cyan-400/90">Read the market, understand the signals</span>
        </div>
      </div>
    </div>
  );
};
