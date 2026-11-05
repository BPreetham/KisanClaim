import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, HelpCircle, CheckCircle2, MessageSquare, CornerDownRight, Volume2, VolumeX } from 'lucide-react';
import { Claim } from '../../types';
import { askCopilot } from '../../services/api';
import { speakAloud, stopSpeaking } from '../../utils/speech';

interface Props {
  claim: Claim;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  groundedFacts?: string[];
}

export const AICopilotChat: React.FC<Props> = ({ claim }) => {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello Officer. I am your AI Claim Intelligence Copilot for claim **${claim.claim_number}** (Farmer: ${claim.farmer.name}). I am grounded directly in this claim's Sentinel-2 NDVI telemetry, Open-Meteo rainfall records, Bhoomi cadastral records, and photographic EXIF sensors. How can I assist your review?`,
      groundedFacts: [
        `Crop: ${claim.crop.crop_name} (${claim.crop.growth_stage})`,
        `NDVI Delta: ${claim.satellite.ndvi_diff} (-${claim.satellite.vegetation_drop_pct}%)`,
        `Rainfall: ${claim.weather.rainfall_disaster_day_mm} mm (${claim.weather.anomaly_ratio}x baseline)`
      ]
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const suggestedQuestions = [
    'Why is this claim considered high priority?',
    'Explain the NDVI difference and satellite evidence.',
    'Is the rainfall consistent with the reported flood?',
    'What are the possible inconsistencies or fraud risks?',
    'How was the indicative claim payout calculated?'
  ];

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const toggleSpeak = (text: string, index: number) => {
    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      speakAloud(text, {
        lang: 'en-IN',
        rate: 1.0,
        onStart: () => setSpeakingIndex(index),
        onEnd: () => setSpeakingIndex(null),
        onError: () => setSpeakingIndex(null)
      });
    }
  };

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await askCopilot(claim.id, text);
      const botMsg: Message = {
        role: 'assistant',
        content: resp.answer,
        groundedFacts: resp.grounded_facts
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Apologies, unable to process the copilot inquiry at this moment.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col h-[520px] shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Reviewer Copilot
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                Grounded in Claim Data
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context: {claim.claim_number} • {claim.farmer.name}</p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="p-2.5 bg-slate-950/70 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar">
        <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap pl-1">Ask Copilot:</span>
        {suggestedQuestions.slice(0, 3).map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap text-[11px] transition border border-slate-700/60"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  AI
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {/* Grounded facts badge */}
                {m.groundedFacts && m.groundedFacts.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="font-bold text-cyan-400 block mb-1">Grounded telemetry cross-checks:</span>
                    <ul className="space-y-0.5">
                      {m.groundedFacts.map((f, i) => (
                        <li key={i} className="flex items-center gap-1 font-mono text-slate-400">
                          <span className="text-cyan-400">›</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Speak Answer Button for Assistant */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSpeak(m.content, idx)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        speakingIndex === idx
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                      title={speakingIndex === idx ? 'Stop reading' : 'Read answer aloud'}
                    >
                      {speakingIndex === idx ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-400" />
                          <span>Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Speak Answer</span>
                        </>
                      )}
                    </button>
                    {speakingIndex === idx && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        Speaking...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 italic pl-10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Copilot synthesizing telemetry...
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 bg-slate-850 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask copilot about NDVI, rainfall anomaly, fraud checks..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
