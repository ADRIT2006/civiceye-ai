import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  Award,
  Layers,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export const CitizenCopilotPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useTranslation();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'copilot',
      text: language === 'bn' 
        ? 'নমস্কার! আমি সিভিকআই কোপাইলট। আপনি যে নাগরিক সমস্যার সম্মুখীন হচ্ছেন (যেমন: রাস্তার গর্ত, ড্রেন, আবর্জনা বা বাতি) তা আমাকে বলুন। আমি আপনাকে সঠিকভাবে রিপোর্ট তৈরি করতে ও ক্রেডিট অর্জন করতে সাহায্য করব।'
        : language === 'hi'
        ? 'नमस्ते! मैं सिविकआई कोपायलट हूँ। मुझे किसी भी नागरिक समस्या (जैसे: सड़क का गड्ढा, स्ट्रीटलाइट, कचरा या जल रिसाव) के बारे में बताएं। मैं सही रिपोर्ट दर्ज करने में आपकी सहायता करूँगा।'
        : 'Hello! I am your CivicEye Copilot. Describe any civic defect you see (e.g., "There is a big hole in the road near my college"), and I will help classify it, draft a formal description, check for safety hazards, and guide your submission to earn Civic Credits.',
      suggestedData: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    {
      label: '🕳️ Big pothole near college',
      text: 'There is a big hole in the road near my college.'
    },
    {
      label: '⚡ Sparking wire danger',
      text: 'Exposed sparking wire hanging over the street corner with sparks falling.'
    },
    {
      label: '💡 Dark streetlights',
      text: 'The streetlights on 12th Main road have been completely dark for 3 nights.'
    },
    {
      label: '💧 Burst water pipeline',
      text: 'High pressure drinking water pipe ruptured and is flooding the neighborhood lane.'
    },
    {
      label: '🏆 How do Civic Credits work?',
      text: 'How do I earn and confirm Civic Credit points?'
    },
    {
      label: '🔄 Duplicate detection explanation',
      text: 'What does "An existing issue may already have been reported" mean?'
    }
  ];

  const handleSendMessage = async (msgText = inputMessage) => {
    const textToSend = (typeof msgText === 'string' ? msgText : inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.copilotChat({
        message: textToSend,
        role: 'citizen',
        language: language,
        user_id: user.id
      });

      let draftSuggestion = null;
      if (res.suggested_category || res.suggested_title) {
        draftSuggestion = {
          category: res.suggested_category,
          title: res.suggested_title,
          description: res.suggested_description
        };
      }

      const copilotMsg = {
        id: Date.now() + 1,
        sender: 'copilot',
        text: res.response || 'I am ready to help you formulate your civic complaint.',
        suggestedData: draftSuggestion,
        isEmergency: res.is_emergency,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'copilot',
          text: 'I could not process that request right now. You can report directly on the Report Issue page.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDraft = (draft) => {
    navigate('/report', { state: { draft } });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>CivicEye Copilot — Citizen AI Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Intelligent Civic Reporting Assistant
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
            Ask questions in English, বাংলা, or हिन्दी. Copilot classifies your issue, writes official descriptions, screens for emergency hazards, and explains duplicate detection.
          </p>
        </div>

        <button
          onClick={() => navigate('/report')}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow transition"
        >
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <span>Go to Report Form</span>
        </button>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[640px] overflow-hidden">
        {/* Chat Header Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>CivicEye Copilot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-400 font-normal">Active & Scoped</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Citizen Privacy Guardrail Active • Human Approval Required Before Submission
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 font-bold">
            Lang: {language.toUpperCase()}
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-2xl ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2.5">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : m.isEmergency
                      ? 'bg-red-50 border border-red-200 text-red-950 font-medium'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  <div
                    className={`text-[10px] mt-2 font-mono ${
                      m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {/* AI Draft Suggestion Box (User must approve before using) */}
                {m.suggestedData && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        AI Draft Generated (Approval Required)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Category: {m.suggestedData.category}
                      </span>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-xl border border-blue-100 text-slate-700">
                      <div className="font-bold text-slate-900">{m.suggestedData.title}</div>
                      <div className="text-[11px] text-slate-600">{m.suggestedData.description}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 italic">
                        * AI will never submit automatically. Review and approve details.
                      </span>
                      <button
                        onClick={() => handleApplyDraft(m.suggestedData)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition active:scale-95 text-xs"
                      >
                        <span>Use this Draft</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-md">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-xs text-slate-500 animate-pulse">
                Copilot is analyzing your report description...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Try asking:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-semibold shrink-0 transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your issue in English, বাংলা, or हिन्दी (e.g. 'There is a big hole in the road near my college')..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
