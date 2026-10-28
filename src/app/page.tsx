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
  UserCheck,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Lead } from "@/types";

type CallStatus = "ready" | "connecting" | "listening" | "thinking" | "speaking" | "ended";
type PhoneTab = "call" | "book" | "status" | "transcript" | "info";

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

  // User-Safe Status Lookup State (Only sees their own consultation)
  const [statusSearchPhone, setStatusSearchPhone] = useState("");
  const [myAppointment, setMyAppointment] = useState<{
    appointmentId?: string;
    clientName?: string;
    phone?: string;
    propertyType?: string;
    cityLocation?: string;
    projectScope?: string;
    consultationDateTime?: string;
    status?: string;
    googleMeetUrl?: string | null;
  } | null>(null);
  const [isSearchingStatus, setIsSearchingStatus] = useState(false);
  const [statusSearchResult, setStatusSearchResult] = useState<string | null>(null);

  // Tab in Phone UI
  const [phoneTab, setPhoneTab] = useState<PhoneTab>("call");
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

  // Start Vapi Call
  const startVoiceCall = useCallback(async () => {
    setErrorMessage(null);
    setBookingSuccessMsg(null);
    setCallStatus("connecting");

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
        const utter = new SpeechSynthesisUtterance("Namaste! Studio Olives Cre mein aapka swagat hai. Main Tisha hoon.");
        utter.rate = 0.9;
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
            text: "नमस्ते! स्टूडियो ऑलिव्स क्री में आपका स्वागत है। मैं तिशा हूँ। आपका नाम जान सकती हूँ?",
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
            if (transcript.toLowerCase().includes("meet.google.com")) {
              const match = transcript.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
              if (match) {
                setActiveMeetingUrl(match[0]);
                setBookingSuccessMsg(`Consultation confirmed! Google Meet URL generated.`);
              }
            }
          }
        }
      });

      vapi.on("error", (err: unknown) => {
        console.error("Vapi call notice:", err);
        const errObj = err as Record<string, unknown>;
        const errType = (errObj?.error as Record<string, unknown>)?.type || errObj?.type;
        // Daily teardown events are normal on end
        if (errType === "daily-error" || errType === "ejected") {
          setCallStatus("ended");
          return;
        }
        setErrorMessage("Connection refreshed. Tap Call to reconnect.");
        setCallStatus("ended");
      });

      vapi.on("call-end", () => {
        setCallStatus("ended");
      });

      // Start call with configured assistant ID
      if (assistantId && !assistantId.includes("your_assistant_id")) {
        await vapi.start(assistantId);
      } else {
        await vapi.start();
      }
    } catch (err: unknown) {
      console.error("Failed to start call:", err);
      setErrorMessage("Could not start audio call. Please check microphone permissions.");
      setCallStatus("ready");
    }
  }, []);

  const endVoiceCall = useCallback(() => {
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

      const confirmedRecord = {
        appointmentId: data.appointmentId || `APT-${Date.now().toString().slice(-6)}`,
        clientName: inputName.trim() || "Private Luxury Client",
        phone: inputPhone.trim(),
        propertyType: "Luxury Residence / Penthouse",
        cityLocation: "Delhi NCR",
        projectScope: inputNotes.trim() || "Turnkey Luxury Architecture & Interiors",
        consultationDateTime: `${inputDate} at ${inputSlot} IST`,
        status: "CONFIRMED",
        googleMeetUrl: data.meetingUrl || null,
      };

      setMyAppointment(confirmedRecord);
      setStatusSearchPhone(inputPhone.trim());

      setBookingSuccessMsg(
        `Consultation confirmed for ${inputPhone}! Ref ID: #${confirmedRecord.appointmentId}. Our senior design team will connect with you.`
      );
      setPhoneTab("status");
    } catch (err: unknown) {
      console.error("Booking error:", err);
      setErrorMessage("Could not submit consultation request. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // User-Safe Status Search: Only returns THAT client's appointment
  const handleCheckMyAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSearchPhone || statusSearchPhone.trim().length < 5) {
      setStatusSearchResult("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSearchingStatus(true);
    setStatusSearchResult(null);
    try {
      const res = await fetch(`/api/user/my-appointment?phone=${encodeURIComponent(statusSearchPhone.trim())}`);
      const data = await res.json();
      if (data.found && data.appointments?.length > 0) {
        setMyAppointment(data.appointments[0]);
        setStatusSearchResult(null);
      } else {
        setMyAppointment(null);
        setStatusSearchResult("No consultation found for this number. You can book an appointment with Tisha anytime.");
      }
    } catch {
      setStatusSearchResult("Could not connect to concierge server. Please try again.");
    } finally {
      setIsSearchingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111317] text-neutral-100 flex flex-col justify-between py-6 px-4 font-sans select-none">
      {/* Top Brand Navbar — Clean & Client-Exclusive (No Internal Admin Links) */}
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

        {/* Client Luxury Indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700/80 text-neutral-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Delhi NCR Atelier • ₹5 Cr+ Projects</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#DFC085] font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Tisha: AI Luxury Coordinator</span>
          </div>
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
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Phone Screen Inner Display */}
          <div className="flex-1 flex flex-col justify-between px-4 py-2 overflow-hidden z-10">
            {/* Caller Header Card */}
            <div className="text-center pt-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] font-medium block">
                Studio Olives Cre
              </span>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-white mt-0.5">
                Tisha
              </h1>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Luxury Consultation Coordinator
              </p>

              {/* Call Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mt-2 text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    callStatus === "speaking"
                      ? "bg-emerald-400 animate-ping"
                      : callStatus === "listening"
                      ? "bg-cyan-400 animate-pulse"
                      : callStatus === "connecting"
                      ? "bg-amber-400 animate-bounce"
                      : "bg-neutral-500"
                  }`}
                />
                <span className="capitalize font-mono text-neutral-300">
                  {callStatus === "ready"
                    ? "Ready to Connect"
                    : callStatus === "connecting"
                    ? "Dialing Atelier..."
                    : callStatus === "speaking"
                    ? "Tisha Speaking"
                    : callStatus === "listening"
                    ? "Listening to You"
                    : callStatus === "ended"
                    ? "Call Ended"
                    : "Connecting"}
                </span>
                {callStatus !== "ready" && callStatus !== "ended" && (
                  <span className="text-neutral-500 font-mono ml-1">
                    ({formatTimer(callDuration)})
                  </span>
                )}
              </div>
            </div>

            {/* Error & Success Toasts */}
            {errorMessage && (
              <div className="bg-red-950/80 border border-red-500/40 text-red-200 text-xs p-2.5 rounded-xl flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[11px] leading-tight">{errorMessage}</p>
              </div>
            )}

            {bookingSuccessMsg && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs p-2.5 rounded-xl flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-[11px] leading-tight">{bookingSuccessMsg}</p>
              </div>
            )}

            {/* TAB 1: Voice Call Center Visualizer */}
            {phoneTab === "call" && (
              <div className="flex-1 flex flex-col items-center justify-center my-auto">
                {/* AI Breathing Glow Ring */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute w-40 h-40 rounded-full transition-all duration-700 ${
                      callStatus === "speaking"
                        ? "bg-emerald-500/20 scale-125 blur-xl"
                        : callStatus === "listening"
                        ? "bg-cyan-500/20 scale-110 blur-lg"
                        : "bg-[#C5A059]/10 scale-95 blur-md"
                    }`}
                  />
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#141824] to-[#1F2637] border-2 border-[#C5A059]/50 shadow-[0_0_30px_rgba(197,160,89,0.3)] flex items-center justify-center z-10">
                    <div className="w-20 h-20 rounded-full bg-[#18191A] flex flex-col items-center justify-center">
                      <span className="font-serif text-2xl font-bold text-[#DFC085]">T</span>
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400">Naraina Vihar</span>
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-neutral-400 max-w-[240px] mt-6 font-light leading-relaxed">
                  {callStatus === "ready"
                    ? "“Speak naturally in Hindi or English. Tisha qualifies your vision and schedules an appointment.”"
                    : callStatus === "listening"
                    ? "Go ahead, tell Tisha about your luxury property requirements..."
                    : callStatus === "speaking"
                    ? "Tisha is responding with bespoke consultation guidance..."
                    : "Call completed. You can book an appointment anytime below."}
                </p>

                {/* Call Action Controls */}
                <div className="flex items-center gap-6 mt-6">
                  {callStatus === "ready" || callStatus === "ended" ? (
                    <button
                      onClick={startVoiceCall}
                      className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-transform hover:scale-105 active:scale-95"
                      title="Start Voice Call with Tisha"
                    >
                      <Phone className="w-7 h-7" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={toggleMute}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                          isMuted
                            ? "bg-red-950/80 border-red-500 text-red-300"
                            : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        }`}
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={endVoiceCall}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-transform hover:scale-105 active:scale-95"
                        title="End Call"
                      >
                        <PhoneOff className="w-7 h-7" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setPhoneTab("book")}
                    className="text-[11px] text-[#C5A059] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book Consultation by Phone
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Direct Appointment Booking Form */}
            {phoneTab === "book" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="font-semibold text-white">Book Luxury Consultation</span>
                  <button onClick={() => setPhoneTab("call")} className="text-[10px] text-neutral-400 hover:text-white">
                    Back to Call
                  </button>
                </div>

                <form onSubmit={handleDirectPhoneBooking} className="space-y-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Malhotra"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      required
                      className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Mobile Number (India +91) *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98110 02233"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      required
                      className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={inputDate}
                        onChange={(e) => setInputDate(e.target.value)}
                        className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                        Time Slot
                      </label>
                      <select
                        value={inputSlot}
                        onChange={(e) => setInputSlot(e.target.value)}
                        className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                      >
                        <option value="11:30 AM">11:30 AM IST</option>
                        <option value="03:30 PM">03:30 PM IST</option>
                        <option value="05:00 PM">05:00 PM IST</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Property & Scope Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 8,000 sq ft Luxury Villa, Chhatarpur Delhi (Budget ₹6 Cr+)"
                      value={inputNotes}
                      onChange={(e) => setInputNotes(e.target.value)}
                      className="w-full bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                      Email Address (Optional)
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
                    <span>{isSubmittingBooking ? "Confirming..." : "Request Luxury Consultation"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: User's Own Consultation Status (Strictly Isolated Client View) */}
            {phoneTab === "status" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="font-semibold text-white">My Consultation Status</span>
                  <button onClick={() => setPhoneTab("call")} className="text-[10px] text-neutral-400 hover:text-white">
                    Close
                  </button>
                </div>

                {/* Search Bar for Client lookup */}
                <form onSubmit={handleCheckMyAppointment} className="flex gap-1.5">
                  <input
                    type="tel"
                    placeholder="Enter phone: +91 98110..."
                    value={statusSearchPhone}
                    onChange={(e) => setStatusSearchPhone(e.target.value)}
                    className="flex-1 bg-[#11151F] border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingStatus}
                    className="px-3 py-2 bg-[#C5A059] hover:bg-[#DFC085] text-neutral-950 rounded-xl font-semibold flex items-center justify-center"
                    title="Search my booking"
                  >
                    <Search className={`w-3.5 h-3.5 ${isSearchingStatus ? "animate-spin" : ""}`} />
                  </button>
                </form>

                {statusSearchResult && (
                  <p className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl">
                    {statusSearchResult}
                  </p>
                )}

                {myAppointment ? (
                  <div className="bg-gradient-to-b from-[#181D2A] to-[#10141E] border border-[#C5A059]/40 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#DFC085] font-semibold">
                        Ref #{myAppointment.appointmentId || "SOC-CONFIRMED"}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        {myAppointment.status || "CONFIRMED"}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-neutral-200">
                      <p><strong>Client:</strong> {myAppointment.clientName}</p>
                      <p><strong>Contact:</strong> {myAppointment.phone}</p>
                      <p><strong>Consultation:</strong> {myAppointment.consultationDateTime}</p>
                      <p><strong>Scope:</strong> {myAppointment.projectScope}</p>
                    </div>

                    <div className="pt-2 border-t border-white/10 text-[10px] text-neutral-400">
                      <p>Our senior architectural partners will review your floor plans during this consultation.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500 text-[11px] space-y-2">
                    <UserCheck className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p>Enter your mobile number above to look up your scheduled consultation.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Live Dialogue Transcript Inside Phone Screen */}
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

            {/* TAB 5: Brand & Studio Info */}
            {phoneTab === "info" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="font-semibold text-white">Studio Olives Cre Atelier</span>
                  <button onClick={() => setPhoneTab("call")} className="text-[10px] text-neutral-400 hover:text-white">
                    Close
                  </button>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl text-[11px] space-y-1.5 text-neutral-300">
                  <p><strong>Headquarters:</strong> E-39 Naraina Vihar, New Delhi</p>
                  <p><strong>Established:</strong> 2016 (75+ Architects & Engineers)</p>
                  <p><strong>Portfolio:</strong> 50+ luxury projects across India & UAE</p>
                  <p><strong>Flagship:</strong> 6,000 sq ft bespoke penthouse for Hardik Pandya</p>
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
                onClick={() => setPhoneTab("status")}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  phoneTab === "status" ? "text-blue-400 font-semibold" : "hover:text-white"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>My Status</span>
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

      {/* Footer — Elegant Luxury Studio with Discreet Staff Access Link */}
      <footer className="text-center text-xs text-neutral-500 py-2 flex items-center justify-center gap-3">
        <span>Studio Olives Cre • Architecture & Luxury Interiors • Delhi NCR & UAE</span>
        <span className="text-neutral-700">•</span>
        <Link
          href="/admin"
          className="text-neutral-600 hover:text-neutral-400 text-[11px] transition-colors"
          title="Internal Staff & Management Access"
        >
          Staff Portal
        </Link>
      </footer>
    </div>
  );
}
