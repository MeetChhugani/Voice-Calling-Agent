"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ExternalLink,
  ChevronRight,
  Wifi,
  Battery,
  Signal,
  CalendarCheck,
  Building,
  MessageSquare,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { Lead } from "@/types";
import { VAPI_ASSISTANT_CONFIG } from "@/config/tisha-system-prompt";

type CallStatus = "ready" | "connecting" | "listening" | "thinking" | "speaking" | "ended";

export default function VoiceConsultationPage() {
  const [callStatus, setCallStatus] = useState<CallStatus>("ready");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState<{ id: string; role: "assistant" | "user"; text: string; time: string }[]>([]);
  const [lead, setLead] = useState<Partial<Lead>>({});
  const [activeMeetingUrl, setActiveMeetingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Phone Booking Form State
  const [inputPhone, setInputPhone] = useState("+91 ");
  const [inputName, setInputName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputDate, setInputDate] = useState("2026-10-30");
  const [inputSlot, setInputSlot] = useState("11:30 AM");
  const [inputNotes, setInputNotes] = useState("");

  // Tab in Phone UI
  const [phoneTab, setPhoneTab] = useState<"call" | "book" | "transcript" | "info">("call");
  const [currentTime, setCurrentTime] = useState("12:00 PM");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const intv = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 30000);
    return () => clearInterval(intv);
  }, []);

  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript inside phone
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, callStatus]);

  // Call timer counter
  useEffect(() => {
    if (callStatus === "listening" || callStatus === "speaking" || callStatus === "thinking") {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (callStatus === "ready") {
        setCallDuration(0);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startVoiceCall = useCallback(async () => {
    setErrorMessage(null);
    setBookingSuccessMsg(null);
    setCallStatus("connecting");
    setCallDuration(0);

    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (!publicKey || publicKey.includes("your_vapi_public_key")) {
      // Offline / Simulation fallback mode
      setCallStatus("speaking");
      const introMsg = {
        id: `msg-${Date.now()}`,
        role: "assistant" as const,
        text: "नमस्ते जी, मैं तिशा बोल रही हूँ, स्टूडियो ऑलिव्स क्री से। आपका नाम जान सकती हूँ?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([introMsg]);

      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance("Hello, welcome to Studio Olives Cre. May I know your name please?");
        utter.rate = 0.95;
        utter.onend = () => setCallStatus("listening");
        window.speechSynthesis.speak(utter);
      } else {
        setTimeout(() => setCallStatus("listening"), 2500);
      }
      return;
    }

    try {
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(publicKey);
      }
      const vapi = vapiRef.current;

      vapi.on("call-start", () => {
        setCallStatus("listening");
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: "assistant",
            text: "नमस्ते जी, मैं तिशा बोल रही हूँ, स्टूडियो ऑलिव्स क्री से। आपका नाम जान सकती हूँ?",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      });

      vapi.on("speech-start", () => {
        setCallStatus("speaking");
      });

      vapi.on("speech-end", () => {
        setCallStatus("listening");
      });

      vapi.on("message", (msg: unknown) => {
        const message = msg as Record<string, unknown>;
        if (message.type === "transcript") {
          const transcriptType = message.transcriptType as string;
          const transcript = message.transcript as string;
          const role = message.role as "user" | "assistant";

          if (transcriptType === "final" && transcript) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-${Math.random()}`,
                role: role === "user" ? "user" : "assistant",
                text: transcript,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);

            // Real-time slot and name detection
            if (role === "user" && !lead.full_name) {
              setLead((prev) => ({ ...prev, full_name: transcript.replace(/my name is|i am|mera naam/i, "").trim() }));
            }
          }
        }

        if (message.type === "function-call-result" || message.type === "tool-call-result") {
          const result = (message.result || {}) as Record<string, unknown>;
          if (result.meeting_url) {
            setActiveMeetingUrl(result.meeting_url as string);
            setBookingSuccessMsg(`Consultation confirmed! Google Meet URL generated and saved into Excel.`);
          }
        }
      });

      vapi.on("call-end", () => {
        setCallStatus("ended");
      });

      vapi.on("error", (err: unknown) => {
        const errObj = err as Record<string, any>;
        const msg =
          errObj?.error?.message?.msg ||
          errObj?.error?.errorMsg ||
          errObj?.message?.msg ||
          (err instanceof Error ? err.message : "");

        if (
          msg === "Exiting meeting because room was deleted" ||
          msg === "Meeting has ended" ||
          errObj?.type === "daily-error" ||
          errObj?.type === "daily-call-join-error"
        ) {
          setCallStatus("ended");
          return;
        }

        console.error("Vapi call error:", err);
        setErrorMessage(typeof msg === "string" && msg ? msg : "Voice session ended.");
        setCallStatus("ready");
      });

      // Start call with configured assistant ID or transient configuration
      if (assistantId && !assistantId.includes("your_vapi_assistant_id")) {
        await vapi.start(assistantId);
      } else {
        await vapi.start(VAPI_ASSISTANT_CONFIG as any);
      }
    } catch (err: unknown) {
      console.error("Failed to start Vapi session:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Microphone permission denied or unable to reach Vapi services."
      );
      setCallStatus("ready");
    }
  }, [lead.full_name]);

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallStatus("ended");
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const nextMute = !isMuted;
      vapiRef.current.setMuted(nextMute);
      setIsMuted(nextMute);
    } else {
      setIsMuted((prev) => !prev);
    }
  }, [isMuted]);

  // Direct phone number appointment booking handler
  const handleDirectPhoneBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setErrorMessage(null);
    setBookingSuccessMsg(null);

    try {
      const startIso = `${inputDate}T${inputSlot === "11:30 AM" ? "11:30:00" : inputSlot === "03:30 PM" ? "15:30:00" : "17:00:00"}+05:30`;
      const endIso = `${inputDate}T${inputSlot === "11:30 AM" ? "12:15:00" : inputSlot === "03:30 PM" ? "16:15:00" : "17:45:00"}+05:30`;

      const res = await fetch("/api/calendar/book-meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: inputName.trim() || "Private Luxury Client",
          phone: inputPhone.trim(),
          email: inputEmail.trim() || "client@studioolivescre.com",
          slot_start_time: startIso,
          slot_end_time: endIso,
          timezone: "Asia/Kolkata",
          project_overview: inputNotes.trim() || "Turnkey Luxury Residential Architecture & Interior Design (₹5 Cr+)",
        }),
      });

      const data = await res.json();

      if (data.meetingUrl) {
        setActiveMeetingUrl(data.meetingUrl);
      }

      setBookingSuccessMsg(
        `Appointment successfully recorded for ${inputPhone}! Added to the Studio Olives Cre Excel spreadsheet for our design partners.`
      );
      setPhoneTab("call");
    } catch (err: unknown) {
      console.error("Booking error:", err);
      setErrorMessage("Could not record appointment. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111317] text-neutral-100 flex flex-col justify-between py-6 px-4 font-sans select-none">
      {/* Top Brand Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#18191A] border border-[#C5A059]/40 flex items-center justify-center text-[#DFC085] font-serif font-bold text-sm shadow-md">
            OC
          </div>
          <div>
            <span className="font-serif tracking-[0.2em] text-xs font-semibold uppercase text-neutral-100 block">
              Studio Olives Cre
            </span>
            <span className="text-[10px] text-[#A3B18A] tracking-wider block font-medium">
              Architecture & Luxury Interiors • Est. 2016
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/workflow"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workflow Studio</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Staff Portal (Excel Access)</span>
          </Link>
          <a
            href="/api/admin/export-excel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </a>
        </div>
      </header>

      {/* Main Center Area: Luxury Phone Screen Device */}
      <main className="flex-1 flex flex-col items-center justify-center my-6">
        {/* Smartphone Hardware Frame */}
        <div className="relative w-[360px] sm:w-[390px] h-[740px] bg-[#0A0C10] rounded-[48px] p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(197,160,89,0.15)] border-[5px] border-[#2A2F3D] flex flex-col justify-between overflow-hidden">
          {/* Dynamic Island / Speaker Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18191A] border border-neutral-700 mr-2" />
            <span className="w-2 h-2 rounded-full bg-blue-900/40" />
          </div>

          {/* Smartphone Status Bar */}
          <div className="w-full flex items-center justify-between px-6 pt-2 pb-1 text-[11px] text-neutral-400 font-mono z-40">
            <span>{currentTime}</span>
            <div className="flex items-center gap-2">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3 text-emerald-400" />
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Phone Screen Display Body */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#141822] to-[#0A0C12] rounded-[36px] p-5 overflow-hidden relative border border-white/5">
            {/* Screen Header */}
            <div className="text-center pt-2 pb-3">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C5A059] block">
                STUDIO OLIVES CRE
              </span>
              <h2 className="font-serif text-lg font-bold text-white mt-0.5">Tisha</h2>
              <p className="text-[11px] text-neutral-400">Luxury Consultation Coordinator</p>

              {/* Live Status indicator */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    callStatus === "listening"
                      ? "bg-emerald-400 animate-ping"
                      : callStatus === "speaking"
                      ? "bg-[#C5A059] animate-bounce"
                      : callStatus === "connecting"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-neutral-500"
                  }`}
                />
                <span className="text-neutral-300">
                  {callStatus === "ready" && "Ready to Connect"}
                  {callStatus === "connecting" && "Calling Tisha..."}
                  {callStatus === "listening" && `Connected (${formatTimer(callDuration)})`}
                  {callStatus === "speaking" && `Tisha Speaking...`}
                  {callStatus === "ended" && "Call Finished"}
                </span>
              </div>
            </div>

            {/* Notification alert banners */}
            {bookingSuccessMsg && (
              <div className="my-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{bookingSuccessMsg}</p>
                  {activeMeetingUrl && (
                    <a
                      href={activeMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-200 underline mt-1 font-mono text-[10px]"
                    >
                      <span>Join Google Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="my-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="flex-1">{errorMessage}</p>
              </div>
            )}

            {/* Screen Content Tabs */}
            {phoneTab === "call" && (
              <div className="flex-1 flex flex-col items-center justify-center my-auto space-y-6">
                {/* Caller Avatar / Waveform Orb */}
                <div className="relative">
                  {callStatus === "speaking" && (
                    <div className="absolute -inset-4 rounded-full bg-[#C5A059]/20 animate-ping" />
                  )}
                  {callStatus === "listening" && (
                    <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse" />
                  )}

                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-[#1B2232] to-[#2B354D] border-2 border-[#C5A059]/40 flex flex-col items-center justify-center shadow-xl">
                    <span className="font-serif text-3xl font-bold text-[#DFC085]">T</span>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mt-1">
                      Naraina Vihar
                    </span>
                  </div>
                </div>

                <div className="text-center px-4">
                  <p className="text-xs text-neutral-300 leading-relaxed font-light">
                    &ldquo;Speak naturally in Hindi or English. Tisha qualifies your vision and schedules an appointment.&rdquo;
                  </p>
                </div>

                {/* In-Call Audio Controls */}
                {callStatus !== "ready" && callStatus !== "ended" ? (
                  <div className="flex items-center gap-6">
                    <button
                      onClick={toggleMute}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                        isMuted
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                          : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      title="End Call"
                    >
                      <PhoneOff className="w-7 h-7" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={startVoiceCall}
                      className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Phone className="w-8 h-8 fill-current" />
                      <span className="text-[10px] uppercase font-bold tracking-wider mt-1">Call</span>
                    </button>

                    <button
                      onClick={() => setPhoneTab("book")}
                      className="text-xs text-[#DFC085] hover:underline flex items-center gap-1 font-medium mt-1 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book by Phone Number directly</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Direct Phone Booking Tab */}
            {phoneTab === "book" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#C5A059]" />
                    Book Consultation
                  </span>
                  <button
                    onClick={() => setPhoneTab("call")}
                    className="text-[10px] text-neutral-400 hover:text-white"
                  >
                    Back to Call
                  </button>
                </div>

                <form onSubmit={handleDirectPhoneBooking} className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Phone Number (Required)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 93075 12816"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={inputDate}
                        onChange={(e) => setInputDate(e.target.value)}
                        className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-2 py-2 text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                        Slot
                      </label>
                      <select
                        value={inputSlot}
                        onChange={(e) => setInputSlot(e.target.value)}
                        className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-2 py-2 text-white text-[11px]"
                      >
                        <option value="11:30 AM">11:30 AM IST</option>
                        <option value="03:30 PM">03:30 PM IST</option>
                        <option value="05:00 PM">05:00 PM IST</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Email Address (For Google Meet Link)
                    </label>
                    <input
                      type="email"
                      placeholder="vikram@malhotra.in"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#DFC085] text-neutral-950 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md mt-2"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>{isSubmittingBooking ? "Saving Appointment..." : "Confirm & Save to Excel"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Live Dialogue Transcript Inside Phone Screen */}
            {phoneTab === "transcript" && (
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto pr-1 space-y-2 pt-2 text-xs font-sans">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                    Real-time Transcript
                  </span>
                  <button onClick={() => setPhoneTab("call")} className="text-[10px] text-neutral-400 hover:text-white">
                    Back to Call
                  </button>
                </div>

                {messages.length === 0 ? (
                  <p className="text-neutral-500 text-center py-10 italic text-[11px]">
                    No conversation yet. Tap Call to talk with Tisha.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                        m.role === "assistant"
                          ? "bg-white/10 text-neutral-200 border border-white/5 mr-4"
                          : "bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 ml-4"
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider block opacity-60 mb-0.5">
                        {m.role === "assistant" ? "Tisha" : "You"}
                      </span>
                      <p>{m.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Brand & Project Info */}
            {phoneTab === "info" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="font-semibold text-white">Studio Olives Cre Facts</span>
                  <button onClick={() => setPhoneTab("call")} className="text-[10px] text-neutral-400 hover:text-white">
                    Close
                  </button>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl text-[11px] space-y-1 text-neutral-300">
                  <p><strong>Headquarters:</strong> E-39 Naraina Vihar, New Delhi</p>
                  <p><strong>Established:</strong> 2016 (75+ Architects & Engineers)</p>
                  <p><strong>Portfolio:</strong> 50+ luxury projects across India & UAE</p>
                  <p><strong>Flagship:</strong> 6,000 sq ft penthouse for Hardik Pandya</p>
                  <p><strong>Investment:</strong> Projects start from ₹5 Crore</p>
                </div>
              </div>
            )}

            {/* Phone Screen Bottom Dock Bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-around text-neutral-400 text-[10px]">
              <button
                onClick={() => setPhoneTab("call")}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  phoneTab === "call" ? "text-emerald-400 font-semibold" : "hover:text-white"
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </button>

              <button
                onClick={() => setPhoneTab("book")}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  phoneTab === "book" ? "text-[#C5A059] font-semibold" : "hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Book</span>
              </button>

              <button
                onClick={() => setPhoneTab("transcript")}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  phoneTab === "transcript" ? "text-cyan-400 font-semibold" : "hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Transcript</span>
              </button>

              <button
                onClick={() => setPhoneTab("info")}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  phoneTab === "info" ? "text-neutral-100 font-semibold" : "hover:text-white"
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Studio</span>
              </button>
            </div>
          </div>

          {/* Smartphone Home Bar */}
          <div className="w-32 h-1 bg-neutral-600 rounded-full mx-auto mt-2" />
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="text-center text-xs text-neutral-500 py-2">
        <span>Studio Olives Cre • Every consultation is automatically written to the shared Excel file for staff review.</span>
      </footer>
    </div>
  );
}
