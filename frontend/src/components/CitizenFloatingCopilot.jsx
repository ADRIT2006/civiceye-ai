import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot, X, ArrowRight, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';

export const CitizenFloatingCopilot = () => {
  const { currentRole, user } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    {
      sender: 'copilot',
      text: language === 'bn'
        ? 'নমস্কার! কোনো নাগরিক সমস্যা রিপোর্ট করতে চান? আমাকে বিবরণ বলুন, আমি সাহায্য করছি।'
        : language === 'hi'
        ? 'नमस्ते! क्या आप कोई नागरिक शिकायत दर्ज करना चाहते हैं? मुझे बताएं, मैं सहायता करूँगा।'
        : 'Hello! Need help reporting an issue? Describe it here and I will help classify and draft it.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Floating button should only show on citizen workspace
  if (currentRole !== 'citizen') return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userText = message.trim();
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setMessage('');
    setLoading(true);

    try {
      const res = await api.copilotChat({
        message: userText,
        role: 'citizen',
        language: language,
        user_id: user.id
      });

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: res.response,
          draft: res.suggested_category ? {
            category: res.suggested_category,
            title: res.suggested_title,
            description: res.suggested_description
          } : null
        }
      ]);
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        { sender: 'copilot', text: 'I am temporarily unable to respond. Please try reporting directly.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDraft = (draft) => {
    setIsOpen(false);
    navigate('/report', { state: { draft } });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Popover Window */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col h-[460px]">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-xs">CivicEye Copilot</div>
                <div className="text-[10px] text-blue-100">Citizen Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/citizen/copilot');
                }}
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded font-bold transition"
              >
                Expand
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {chatLog.map((c, i) => (
              <div
                key={i}
                className={`flex flex-col ${c.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    c.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{c.text}</p>
                </div>

                {c.draft && (
                  <button
                    onClick={() => handleApplyDraft(c.draft)}
                    className="mt-1.5 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold hover:bg-emerald-100 transition shadow-sm"
                  >
                    <span>Use Draft ({c.draft.category})</span>
                    <ArrowRight className="w-3 h-3 text-emerald-700" />
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <Bot className="w-4 h-4 animate-spin text-blue-600" />
                <span>Copilot is analyzing...</span>
              </div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe issue (e.g. pothole)..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-full shadow-xl shadow-blue-500/25 border-2 border-white transition transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span className="font-sans">CivicEye Copilot</span>
      </button>
    </div>
  );
};
