import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Users,
  Compass,
  X,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const AdminCopilotModal = ({ isOpen, onClose }) => {
  const { currentLanguage } = useLanguage();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello Commissioner. I am your **CivicEye Executive Intelligence Copilot**. How can I assist with municipal operations, ward load balancing, or critical escalations today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const quickPrompts = [
    "How many critical issues are open?",
    "Which ward has the most unresolved issues?",
    "Which workers currently have lowest workload?",
    "Give me an executive municipal status summary"
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.copilotChat({
        message: query,
        role: 'admin',
        language: currentLanguage
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.response || "No response received from command assistant."
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "Executive command query failed. Please verify system connection."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full h-[620px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Admin Command Copilot
                </h3>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  EXECUTIVE LEVEL
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Citywide intelligence, SLA compliance, and dispatch optimization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold shrink-0">Quick Queries:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 rounded-lg shrink-0 font-medium text-slate-600 transition shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat History Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => {
            const isBot = m.sender === 'bot';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    isBot
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-indigo-600 text-white font-medium shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Analyzing city database &amp; dispatch metrics...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about municipal issues, ward backlogs, or personnel..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Query</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
