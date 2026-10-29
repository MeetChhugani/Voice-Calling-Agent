"use client";

import React, { useEffect, useRef } from "react";
import { User, Sparkles } from "lucide-react";

export interface MessageItem {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  time?: string;
}

interface TranscriptPanelProps {
  messages: MessageItem[];
  isSpeaking: boolean;
  isListening: boolean;
}

export function TranscriptPanel({ messages, isSpeaking, isListening }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSpeaking, isListening]);

  return (
    <div className="flex flex-col h-[420px] rounded-xl border border-[#18191A]/10 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#18191A]/10 bg-[#F4EFE6]/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
          <h3 className="font-serif text-sm font-semibold tracking-wide text-[#18191A]">
            Live Dialogue Transcript
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6B775C]">
          {isSpeaking && (
            <span className="flex items-center gap-1.5 font-medium text-[#4A5340]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A5340] animate-pulse" />
              Dhruv Speaking
            </span>
          )}
          {isListening && (
            <span className="flex items-center gap-1.5 font-medium text-[#C5A059]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
              Listening to you
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#18191A]/40 text-xs px-6">
            <Sparkles className="w-6 h-6 mb-2 text-[#C5A059]/60" />
            <p className="font-serif italic text-sm text-[#18191A]/60">
              “A conversation about your vision...”
            </p>
            <p className="mt-1">
              Click &apos;Begin Voice Consultation&apos; to start talking with Dhruv.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === "assistant" ? "items-start" : "items-start justify-end"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#4A5340] text-[#FDFBF7] flex items-center justify-center shrink-0 font-serif text-[11px] font-semibold mt-0.5">
                  T
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-lg p-3.5 ${
                  msg.role === "assistant"
                    ? "bg-[#FDFBF7] border border-[#18191A]/10 text-[#18191A]"
                    : "bg-[#18191A] text-[#FDFBF7]"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-60">
                  <span className="font-semibold uppercase tracking-wider">
                    {msg.role === "assistant" ? "Dhruv (HDFC Bank Prototype)" : "You"}
                  </span>
                  {msg.time && <span>{msg.time}</span>}
                </div>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-[#18191A] text-[#DFC085] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
