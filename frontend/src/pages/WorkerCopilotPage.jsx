import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  User, 
  Send, 
  HardHat, 
  Sparkles, 
  CheckCircle2, 
  FileCheck2, 
  Flame, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export const WorkerCopilotPage = () => {
  const navigate = useNavigate();
  const { user, showToast } = useAuth();
  const { language } = useTranslation();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'copilot',
      text: language === 'bn'
        ? `নমস্কার ${user.name}! আমি আপনার ওয়ার্কার ফিল্ড অ্যাসিস্ট্যান্ট। আপনার অর্পিত কাজের বিষয়ে জিজ্ঞাসা করুন (যেমন: "আজকে আমার কী কাজ অর্পিত আছে?", "কোন কাজটি আগে করা উচিত?", অথবা "CIV-2026-0007 এর সারাংশ দিন")।`
        : language === 'hi'
        ? `नमस्ते ${user.name}! मैं आपका वर्कर फ़ील्ड असिस्टेंट हूँ। अपने सौंपे गए कार्यों के बारे में पूछें (जैसे: "आज मुझे कौन सा काम सौंपा गया है?", "मुझे सबसे पहले कौन सा काम संभालना चाहिए?", या "CIV-2026-0007 का सारांश दें")।`
        : `Hello ${user.name}! I am your Worker Copilot & Field Assistant. I am synced with your assigned work orders. Ask me: "What work is assigned to me today?", "Which issue should I handle first?", "Summarize CIV-2026-0007", or type your raw repair notes to draft an official repair report.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // AI Repair Note Generator State
  const [rawNoteInput, setRawNoteInput] = useState('');
  const [ticketForNote, setTicketForNote] = useState('CIV-2026-0007');
  const [generatedNote, setGeneratedNote] = useState('');
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  const workerQuickPrompts = [
    { label: '📋 What work is assigned to me today?', text: 'What work is assigned to me today?' },
    { label: '⚡ Which issue should I handle first?', text: 'Which issue should I handle first?' },
    { label: '🚨 Show my critical issues', text: 'Show my critical issues.' },
    { label: '🔍 Summarize CIV-2026-0007', text: 'Summarize CIV-2026-0007.' },
    { label: '📸 What evidence should I upload?', text: 'What evidence should I upload?' }
  ];

  const handleSendMessage = async (customText = inputMessage) => {
    const text = (typeof customText === 'string' ? customText : inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.copilotChat({
        message: text,
        role: 'worker',
        language: language,
        worker_id: user.id || 2
      });

      const copilotMsg = {
        id: Date.now() + 1,
        sender: 'copilot',
        text: res.response || 'I am processing your field request.',
        suggestedTicket: res.suggested_ticket,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'copilot',
          text: 'Error contacting Worker Copilot assistant. Please check your assigned tasks directly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRepairNote = async () => {
    if (!rawNoteInput.trim()) return;
    setIsGeneratingNote(true);
    try {
      const res = await api.generateRepairNote(rawNoteInput, ticketForNote, language);
      setGeneratedNote(res.generated_note);
    } catch (err) {
      showToast('Failed to generate formal note', 'error');
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handleSaveNoteToTicket = async () => {
    if (!generatedNote.trim()) return;
    try {
      await api.addWorkNote(7, generatedNote, user.name);
      showToast(`Formal note approved & saved to ${ticketForNote}!`, 'success');
      setRawNoteInput('');
      setGeneratedNote('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-orange-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            <HardHat className="w-3.5 h-3.5 text-amber-200" />
            <span>Worker Field Assistant — AI Operations Copilot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Field Crew AI Dispatcher
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl">
            Strictly scoped to tickets assigned to {user.name}. Generates formal municipal repair notes, prioritizes emergencies, and verifies photo angle requirements.
          </p>
        </div>

        <button
          onClick={() => navigate('/worker/dashboard')}
          className="shrink-0 px-5 py-3 bg-white text-orange-700 font-bold text-xs rounded-xl shadow transition hover:bg-orange-50 active:scale-95"
        >
          View Assigned Orders
        </button>
      </div>

      {/* Main Grid: Chat Left + Repair Note Generator Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Worker Chat Assistant */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[620px] overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">Worker Copilot</div>
                <div className="text-[10px] text-slate-500">Authorized: Rajesh Kumar (WRK-2026-002)</div>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              RBAC Scoped
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[90%] ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    m.sender === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <div
                      className={`text-[9px] mt-1.5 font-mono ${
                        m.sender === 'user' ? 'text-orange-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {m.suggestedTicket && (
                    <button
                      onClick={() => navigate(`/worker/issues/${m.suggestedTicket}`)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold border border-amber-200 transition text-[11px]"
                    >
                      <span>Open Work Order {m.suggestedTicket}</span>
                      <ArrowRight className="w-3 h-3 text-amber-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <Bot className="w-4 h-4 animate-spin text-orange-600" />
                <span>Checking assigned work orders...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
            {workerQuickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-800 text-[11px] font-semibold shrink-0 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about your assigned jobs or summarize ticket..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right 5 Cols: AI Repair Note Generator Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <FileCheck2 className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-extrabold text-sm">AI Repair Note Generator</h3>
                <p className="text-[11px] text-slate-500">Turns raw notes into formal municipal logs</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Target Ticket
              </label>
              <select
                value={ticketForNote}
                onChange={(e) => setTicketForNote(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="CIV-2026-0007">CIV-2026-0007 (5th Cross Pothole)</option>
                <option value="CIV-2026-0012">CIV-2026-0012 (HAL Water Leak)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Raw Input Bullet Points
              </label>
              <textarea
                value={rawNoteInput}
                onChange={(e) => setRawNoteInput(e.target.value)}
                rows={3}
                placeholder="e.g. Pothole filled using asphalt. Levelled with roller."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleGenerateRepairNote}
                disabled={!rawNoteInput.trim() || isGeneratingNote}
                className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{isGeneratingNote ? 'Generating...' : 'Generate Official Note'}</span>
              </button>
            </div>

            {/* Generated Output with Worker Edit / Approval Guard */}
            {generatedNote && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950">AI Generated Draft (Edit & Approve)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                    Requires Review
                  </span>
                </div>

                <textarea
                  value={generatedNote}
                  onChange={(e) => setGeneratedNote(e.target.value)}
                  rows={4}
                  className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-amber-700 italic">
                    Worker must approve before saving.
                  </span>
                  <button
                    onClick={handleSaveNoteToTicket}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>AI generates formal records adhering to Municipal Public Works Standards.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
