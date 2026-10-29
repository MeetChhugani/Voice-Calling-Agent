"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  MessageSquare,
  Info,
  AlertTriangle,
  Loader2,
  CreditCard,
  Wifi,
  Signal,
  Send,
} from "lucide-react";
import Link from "next/link";

type CallStatus = "ready" | "connecting" | "listening" | "thinking" | "speaking" | "ended";
type ActiveTab = "call" | "request" | "transcript" | "info";

interface TranscriptMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
}

interface SupportRequest {
  id: string;
  customer_name: string;
  phone: string;
  category: string;
  status: string;
  issue_summary: string;
  created_at: string;
  preferred_callback_time?: string;
  is_fraud_or_urgent?: boolean;
}

export default function HdfcVoiceAssistantPage() {
  const [callStatus, setCallStatus] = useState<CallStatus>("ready");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState<TranscriptMsg[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("call");
  const [typedMessage, setTypedMessage] = useState("");
  const [typedMessageStatus, setTypedMessageStatus] = useState<string | null>(null);

  // My Request lookup
  const [requestPhone, setRequestPhone] = useState("");
  const [requestResults, setRequestResults] = useState<SupportRequest[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSearched, setRequestSearched] = useState(false);

  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
    if (!publicKey || publicKey.includes("your_vapi_public_key")) return;

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;
    vapi.on("call-start", () => {
      setCallStatus("listening");
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCallDuration((duration) => duration + 1), 1000);
    });
    vapi.on("call-end", () => {
      setCallStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });
    vapi.on("speech-start", () => setCallStatus("speaking"));
    vapi.on("speech-end", () => setCallStatus("listening"));
    vapi.on("message", (message) => {
      if (message.type !== "transcript" || message.transcriptType !== "final") return;
      const now = new Date();
      setMessages((previous) => [...previous, {
        id: Date.now().toString() + "-" + Math.random().toString(),
        role: message.role === "assistant" ? "assistant" : "user",
        text: message.transcript,
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    });
    vapi.on("error", (error) => {
      console.error("[Vapi]", error);
      setErrorMessage(error instanceof Error ? error.message : "Vapi call error. Check your assistant settings and try again.");
      setCallStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      try {
        vapi.stop();
      } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startCall = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi) {
      setErrorMessage("Vapi is not configured. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID in your deployment settings.");
      return;
    }
    setErrorMessage(null);
    setCallStatus("connecting");
    setMessages([]);
    try {
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim();
      if (assistantId && !assistantId.includes("your_vapi_assistant_id")) {
        await vapi.start(assistantId);
      } else {
        const response = await fetch("/api/vapi/config", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load the Vapi assistant configuration.");
        const config = await response.json();
        if (!config.assistantConfig) throw new Error("Vapi assistant configuration is unavailable.");
        await vapi.start(config.assistantConfig);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start call.");
      setCallStatus("ready");
    }
  }, []);

  const endCall = useCallback(() => {
    try {
      vapiRef.current?.stop();
    } catch {}
    setCallStatus("ended");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const next = !isMuted;
    try {
      vapi.setMuted(next);
      setIsMuted(next);
    } catch {}
  }, [isMuted]);

  const sendTypedMessage = useCallback(() => {
    const message = typedMessage.trim();
    if (!message) return;
    const sessionActive = ["connecting", "listening", "speaking", "thinking"].includes(callStatus);
    const vapi = vapiRef.current;
    if (!vapi || !sessionActive) {
      setTypedMessageStatus("Start a voice session before sending a typed message.");
      return;
    }
    try {
      vapi.send({
        type: "add-message",
        message: { role: "user", content: message },
      });
      setMessages((previous) => [...previous, {
        id: `${Date.now()}-${Math.random()}`,
        role: "user",
        text: `[Typed] ${message}`,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }]);
      setTypedMessage("");
      setTypedMessageStatus(null);
    } catch {
      setTypedMessageStatus("Could not share those details. Please try again or say them aloud.");
    }
  }, [callStatus, typedMessage]);

  const resetCall = () => {
    setCallStatus("ready");
    setMessages([]);
    setCallDuration(0);
    setErrorMessage(null);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRequestLookup = async () => {
    const q = requestPhone.trim();
    if (!q) return;
    setRequestLoading(true);
    setRequestError(null);
    setRequestSearched(true);
    try {
      const res = await fetch(`/api/user/my-appointment?phone=${encodeURIComponent(q)}`);
      const data = await res.json();
      setRequestResults(data.requests || []);
      if (!data.found || (data.requests && data.requests.length === 0)) {
        setRequestError("No requests found for this number.");
      }
    } catch {
      setRequestError("Failed to lookup. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  const callActive =
    callStatus === "connecting" ||
    callStatus === "listening" ||
    callStatus === "speaking" ||
    callStatus === "thinking";

  const statusConfig: Record<CallStatus, { label: string; color: string; pulse: boolean }> = {
    ready: { label: "Ready to Connect", color: "text-slate-300", pulse: false },
    connecting: { label: "Connecting...", color: "text-yellow-300", pulse: true },
    listening: { label: "Listening...", color: "text-emerald-300", pulse: true },
    thinking: { label: "Processing...", color: "text-blue-300", pulse: true },
    speaking: { label: "Dhruv Speaking", color: "text-cyan-300", pulse: true },
    ended: { label: "Call Ended", color: "text-slate-300", pulse: false },
  };

  const sc = statusConfig[callStatus];

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "call", label: "Voice Call", icon: <Phone className="w-4 h-4" /> },
    { id: "request", label: "My Request", icon: <Search className="w-4 h-4" /> },
    { id: "transcript", label: "Transcript", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "info", label: "Helpline Info", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-slate-900"
      style={{ background: "radial-gradient(ellipse at 50% 42%, #ffffff 0%, #f1f6fb 50%, #e7eff7 100%)" }}
    >
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xl shadow-md text-white"
            style={{ backgroundColor: "#004C8F" }}
          >
            H
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base tracking-wide flex items-center gap-2">
              HDFC Bank
              <span className="bg-blue-50 text-blue-800 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full tracking-wider border border-blue-100">
                Prototype
              </span>
            </div>
            <div className="text-xs text-slate-500">AI Customer Assistance Voice Agent</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-medium text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 transition-all px-3 py-1.5 rounded-lg border border-blue-100"
          >
            Staff Dashboard
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-6xl mx-auto w-full">
        {/* Security / Prototype Notice */}
        <div className="w-full max-w-[500px]">
          <section className="relative flex flex-col items-center justify-center px-5 py-5 sm:px-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,76,143,0.10),transparent_60%)]" />
            <div className="relative z-10 mb-7 text-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-800 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Secure voice assistance
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Talk to Dhruv</h1>
              <p className="mt-1 text-sm text-slate-500">HDFC Bank customer assistance prototype</p>
            </div>

            <div className={`relative z-10 phone-float ${callActive ? "phone-active" : ""}`}>
              <div className="absolute -inset-7 rounded-[3.5rem] bg-blue-300/20 blur-2xl" />
              <div className="relative w-[min(82vw,310px)] rounded-[2.8rem] border border-slate-300 bg-gradient-to-br from-slate-300 via-slate-100 to-slate-300 p-[7px] shadow-[0_30px_70px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-400/70">
                <div className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[2.35rem] border border-slate-300 bg-gradient-to-b from-white via-slate-50 to-blue-50 px-4 pb-5 pt-3">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_28%,rgba(0,76,143,0.08),transparent_35%),radial-gradient(circle_at_15%_75%,rgba(59,130,246,0.12),transparent_38%)]" />
                  <div className="relative flex h-7 items-center justify-between px-1 text-[9px] font-semibold text-slate-600">
                    <span>9:41</span><span className="absolute left-1/2 top-0.5 h-4 w-[72px] -translate-x-1/2 rounded-full bg-slate-900" />
                    <span className="flex items-center gap-1"><Signal className="h-3 w-3" /><Wifi className="h-3 w-3" /><span className="ml-0.5 h-2.5 w-4 rounded-[3px] border border-slate-500 p-[1px]"><span className="block h-full w-2/3 rounded-[1px] bg-emerald-500" /></span></span>
                  </div>
                  <div className="relative mt-5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004C8F] font-bold text-white shadow-lg">H</div>
                    <div><div className="text-[11px] font-semibold text-slate-900">HDFC Bank</div><div className="text-[9px] text-slate-500">Dhruv · Voice assistance</div></div>
                    <span className="ml-auto rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] text-blue-800">PROTOTYPE</span>
                  </div>
                  <div className="relative flex flex-1 flex-col items-center justify-center text-center">
                    <div className={`relative mb-5 flex h-28 w-28 items-center justify-center rounded-full border border-blue-200 bg-gradient-to-br from-blue-100 to-white shadow-[0_0_45px_rgba(0,76,143,0.15)] ${callActive ? "animate-pulse" : ""}`}>
                      <div className="absolute inset-2 rounded-full border border-blue-200/70" />
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#004C8F] to-blue-600 text-3xl text-white shadow-inner">✦</div>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">Dhruv</p>
                    <p className="mt-1 text-[10px] text-slate-500">{callActive ? sc.label : "Here to help with your banking query"}</p>
                    {callActive && <p className="mt-2 font-mono text-xs text-blue-800">{formatDuration(callDuration)}</p>}
                    <div className="mt-6 flex max-w-[190px] flex-wrap justify-center gap-1.5">
                      {["Cards", "Accounts", "Loans", "Security"].map((item) => <span key={item} className="rounded-full border border-blue-100 bg-white/80 px-2.5 py-1 text-[8px] text-slate-600">{item}</span>)}
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center gap-5 pb-1">
                    {callActive && <button onClick={toggleMute} aria-label={isMuted ? "Unmute microphone" : "Mute microphone"} className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 ${isMuted ? "bg-amber-500 text-white" : "bg-white text-slate-700"}`}>{isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>}
                    <button onClick={callActive ? endCall : startCall} aria-label={callActive ? "End voice assistance call" : "Start voice assistance call"} disabled={callStatus === "connecting"} className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 disabled:opacity-70 ${callActive ? "rotate-[135deg] bg-red-500" : "bg-[#004C8F]"}`}>
                      {callStatus === "connecting" ? <Loader2 className="h-6 w-6 animate-spin" /> : <Phone className="h-6 w-6" />}
                    </button>
                    {callActive ? <button aria-label="Speaker enabled" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"><Volume2 className="h-4 w-4" /></button> : <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white"><CreditCard className="h-4 w-4 text-blue-800" /></div>}
                  </div>
                  <div className="relative mx-auto mt-4 h-1 w-20 rounded-full bg-slate-400/60" />
                </div>
              </div>
            </div>
            <p className="relative z-10 mt-7 text-center text-xs text-slate-500">{callStatus === "ready" ? "Tap the button to begin" : callStatus === "connecting" ? "Connecting securely…" : callActive ? "Tap red to end · Use the mic to mute" : "Call ended · Tap to start again"}</p>
            {errorMessage && <div className="relative z-10 mt-3 flex max-w-sm items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800"><AlertCircle className="h-4 w-4 shrink-0" />{errorMessage}</div>}
            <div className="relative z-10 mt-6 w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="typed-message" className="text-xs font-semibold text-slate-800">Type to Dhruv</label>
                <span className="text-[10px] text-slate-500">Mobile · email · request details</span>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  id="typed-message"
                  rows={2}
                  maxLength={1000}
                  value={typedMessage}
                  onChange={(event) => { setTypedMessage(event.target.value); setTypedMessageStatus(null); }}
                  onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendTypedMessage(); } }}
                  placeholder="Type a question or details you want to share…"
                  className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={sendTypedMessage}
                  disabled={!typedMessage.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#004C8F] text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send typed message to Dhruv"
                  title={callActive ? "Send message" : "Start a voice session first"}
                ><Send className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">You can type your phone number, email, or a service request. Never enter OTPs, PINs, passwords, CVVs, or full card numbers.</p>
              {typedMessageStatus && <p role="status" className="mt-2 text-[11px] text-amber-700">{typedMessageStatus}</p>}
            </div>
          </section>

          <section className="hidden min-h-[580px] flex-col border-t border-white/10 bg-black/15 lg:border-l lg:border-t-0">
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/15 bg-black/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white border-b-2 border-red-500 shadow-inner font-semibold"
                    : "text-blue-200/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex min-h-[420px] flex-1 flex-col justify-between p-5 sm:p-6">
            {/* TAB 1: CALL */}
            {activeTab === "call" && (
                <div className="hidden flex-col items-center justify-center flex-1 py-4 gap-6">
                {/* Agent Avatar */}
                <div className="relative">
                  <div
                    className={`w-28 h-28 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center border-4 shadow-xl ${
                      sc.pulse ? "border-emerald-400 shadow-emerald-500/30 animate-pulse" : "border-white/30"
                    }`}
                  >
                    <span className="text-5xl select-none">👩‍💼</span>
                  </div>
                  {callActive && (
                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
                  )}
                </div>

                {/* Identity & Status */}
                <div className="text-center">
                  <h1 className="text-white font-bold text-2xl tracking-tight">Dhruv</h1>
                  <p className="text-blue-200 text-xs mt-0.5">HDFC Bank Voice Coordinator</p>
                  <div className={`text-sm font-semibold mt-2 flex items-center justify-center gap-2 ${sc.color}`}>
                    {sc.pulse && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />}
                    {sc.label}
                  </div>
                  {callActive && (
                    <div className="text-blue-200/80 text-xs mt-1.5 flex items-center gap-1.5 justify-center">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Call Duration: {formatDuration(callDuration)}</span>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="w-full bg-red-500/20 border border-red-400/40 rounded-xl p-3 flex items-center gap-2.5 text-left">
                    <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                    <p className="text-red-200 text-xs">{errorMessage}</p>
                  </div>
                )}

                {/* Main Call Action Buttons */}
                {callStatus === "ready" || callStatus === "ended" ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <button
                      onClick={callStatus === "ended" ? resetCall : startCall}
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 hover:scale-105"
                      style={{ backgroundColor: callStatus === "ended" ? "#4B5563" : "#ED1C24" }}
                    >
                      {callStatus === "ended" ? (
                        <PhoneOff className="w-8 h-8 text-white" />
                      ) : (
                        <Phone className="w-8 h-8 text-white" />
                      )}
                    </button>
                    <span className="text-blue-100 text-sm font-medium">
                      {callStatus === "ended" ? "Tap to Reset" : "Start Voice Assistance"}
                    </span>
                    {callStatus === "ended" && (
                      <button onClick={startCall} className="text-blue-300 underline text-xs hover:text-white">
                        Start New Conversation
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-6 mt-2">
                    <button
                      onClick={toggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                        isMuted
                          ? "bg-amber-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30 border border-white/20"
                      }`}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={endCall}
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all hover:bg-red-700"
                      style={{ backgroundColor: "#ED1C24" }}
                      title="End Call"
                    >
                      <PhoneOff className="w-8 h-8 text-white" />
                    </button>
                    <div
                      className="w-14 h-14 rounded-full bg-white/20 border border-white/20 flex items-center justify-center"
                      title="Speaker Active"
                    >
                      <Volume2 className="w-6 h-6 text-white/80" />
                    </div>
                  </div>
                )}

                {/* Helpful Hints */}
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-center mt-2">
                  <p className="text-blue-200/90 text-xs leading-relaxed">
                    Ask Dhruv about <strong className="text-white">Savings Accounts</strong>,{" "}
                    <strong className="text-white">Fixed Deposits</strong>,{" "}
                    <strong className="text-white">Credit Cards</strong>,{" "}
                    <strong className="text-white">Home Loans</strong>, or{" "}
                    <strong className="text-white">Emergency Card Blocking</strong>. Speak naturally in Hindi or
                    English.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: MY REQUEST */}
            {activeTab === "request" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-white font-bold text-lg mb-1">Check Service Request Status</h2>
                  <p className="text-blue-200 text-xs">
                    Enter your 10-digit mobile number or Ticket ID (e.g. HDFC-SR-100234).
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestLookup()}
                    placeholder="Mobile number or Ticket ID..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-blue-300/60 focus:outline-none focus:border-white/50 text-sm"
                  />
                  <button
                    onClick={handleRequestLookup}
                    disabled={requestLoading || !requestPhone.trim()}
                    className="px-5 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-md hover:brightness-110"
                    style={{ backgroundColor: "#ED1C24" }}
                  >
                    {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Lookup</span>
                  </button>
                </div>

                {requestError && (
                  <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-3.5 text-center text-red-200 text-xs">
                    {requestError}
                  </div>
                )}

                {requestSearched && requestResults.length > 0 && (
                  <div className="flex flex-col gap-3 mt-1 max-h-72 overflow-y-auto pr-1">
                    {requestResults.map((req) => (
                      <div key={req.id} className="bg-white/10 border border-white/20 rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <div className="text-white font-bold text-sm tracking-wide">{req.id}</div>
                            <div className="text-blue-300 text-xs capitalize">
                              {req.category?.replace(/_/g, " ") || "General Inquiry"}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                              req.status === "escalated"
                                ? "bg-red-500/30 text-red-300 border border-red-500/40"
                                : req.status === "resolved"
                                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                                : req.status === "in_progress"
                                ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                : "bg-blue-500/30 text-blue-300 border border-blue-500/40"
                            }`}
                          >
                            {req.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-blue-100 text-xs leading-relaxed">{req.issue_summary}</p>
                        {req.preferred_callback_time && (
                          <div className="mt-2 flex items-center gap-1.5 text-blue-200 text-[11px]">
                            <Clock className="w-3 h-3 text-blue-300" />
                            <span>Preferred Callback: {req.preferred_callback_time}</span>
                          </div>
                        )}
                        {req.is_fraud_or_urgent && (
                          <div className="mt-2 flex items-center gap-1.5 text-red-300 text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Urgent Escalation Registered</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-auto">
                  <p className="text-blue-200/90 text-xs text-center">
                    For immediate 24x7 card blocking or emergency support, dial{" "}
                    <strong className="text-white">1800 1600</strong> (Toll Free).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: TRANSCRIPT */}
            {activeTab === "transcript" && (
              <div className="flex flex-col gap-3 h-80 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <MessageSquare className="w-10 h-10 text-white/30 mb-2" />
                    <p className="text-blue-200 text-xs">Live conversation transcript will appear here.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md leading-relaxed ${
                          msg.role === "assistant"
                            ? "bg-white/20 text-white border border-white/10"
                            : "text-white"
                        }`}
                        style={msg.role === "user" ? { backgroundColor: "#ED1C24" } : {}}
                      >
                        <div className="text-[10px] opacity-70 mb-0.5">
                          {msg.role === "assistant" ? "Dhruv" : "You"} · {msg.time}
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* TAB 4: INFO */}
            {activeTab === "info" && (
              <div className="flex flex-col gap-3.5">
                <h2 className="text-white font-bold text-base">Official HDFC Bank Helplines</h2>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { label: "24x7 Customer Care (Toll Free)", number: "1800 1600", desc: "General banking & cards" },
                    { label: "Alternate Helpline (Toll Free)", number: "1800 2600", desc: "24x7 customer assistance" },
                    { label: "Card Hotlisting / Blocking", number: "1800 1600", desc: "Emergency lost card assistance" },
                    { label: "NetBanking Support", number: "1800 2600", desc: "Digital & MobileBanking queries" },
                  ].map((h) => (
                    <div
                      key={h.number + h.label}
                      className="bg-white/10 border border-white/15 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-white font-semibold text-xs">{h.label}</div>
                        <div className="text-blue-200 text-[11px]">{h.desc}</div>
                      </div>
                      <div className="text-white font-mono font-bold text-sm bg-black/20 px-2.5 py-1 rounded-md border border-white/10">
                        {h.number}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="https://www.hdfcbank.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 justify-center py-2.5 rounded-xl text-white text-xs font-semibold border border-white/30 hover:bg-white/10 transition-all mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visit Official HDFC Bank Website
                </a>

                <div className="bg-amber-500/15 border border-amber-400/30 rounded-xl p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-amber-200 font-semibold mb-0.5">Prototype Disclaimer</div>
                      <p className="text-amber-100/80 text-[11px] leading-relaxed">
                        This application is an educational prototype and is not officially operated by or affiliated
                        with HDFC Bank. All banking policies and rates must be verified via official branch or website
                        channels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-slate-500 text-[11px] px-4 border-t border-slate-200 bg-white/60">
        HDFC Bank Customer Assistance Prototype · Security Shield Active · Verified Official Knowledge
      </footer>
    </div>
  );
}
