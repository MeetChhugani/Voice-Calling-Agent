"use client";

import React, { useState } from "react";
import {
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
} from "lucide-react";
import { WebhookPayload } from "@/types/workflow";

interface WebhookTestConsoleProps {
  onTrigger: (payload: WebhookPayload) => void;
  isExecuting: boolean;
}

const SAMPLE_PAYLOADS: { label: string; payload: WebhookPayload }[] = [
  {
    label: "Credit Card Statement Question",
    payload: {
      name: "Anita Sharma",
      phone: "+919811223344",
      email: "anita@example.com",
      propertyType: "Credit card support",
      message: "I need help understanding a charge on my credit card statement.",
      channel: "call",
    },
  },
  {
    label: "Savings Account Inquiry",
    payload: {
      name: "Rohit Dhawan",
      phone: "+919307512816",
      email: "rohit@dhawan.com",
      propertyType: "Savings account",
      message: "I would like to learn about opening a savings account.",
      channel: "call",
    },
  },
  {
    label: "Under-Budget Lead (₹80 Lakhs - Rejected by Filter)",
    payload: {
      name: "Anand Gupta",
      phone: "+919955443322",
      email: "anand@guptatech.com",
      propertyType: "3BHK Apartment",
      budget: "80 Lakhs",
      timeline: "Next month",
      message:
        "Want kitchen renovation and basic false ceiling for 3BHK flat in Noida. Budget is around 80 Lakhs rupees.",
      channel: "web",
    },
  },
];

export function WebhookTestConsole({ onTrigger, isExecuting }: WebhookTestConsoleProps) {
  const [selectedSample, setSelectedSample] = useState<number>(0);
  const [customJson, setCustomJson] = useState<string>(
    JSON.stringify(SAMPLE_PAYLOADS[0].payload, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const handleSelectSample = (index: number) => {
    setSelectedSample(index);
    setCustomJson(JSON.stringify(SAMPLE_PAYLOADS[index].payload, null, 2));
    setParseError(null);
  };

  const handleSend = () => {
    try {
      const parsed = JSON.parse(customJson);
      setParseError(null);
      onTrigger(parsed);
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON syntax");
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#171D2B] border border-[#232B3E] p-6 shadow-xl flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#232B3E] gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Webhook Test Simulation Console
          </h3>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          {SAMPLE_PAYLOADS.map((sample, idx) => (
            <button
              key={sample.label}
              onClick={() => handleSelectSample(idx)}
              className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                selectedSample === idx
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700"
              }`}
            >
              {sample.label.split("(")[0]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
          HTTP POST Payload (JSON)
        </label>
        <textarea
          rows={7}
          value={customJson}
          onChange={(e) => setCustomJson(e.target.value)}
          className="w-full font-mono text-xs bg-[#11151F] border border-neutral-700 rounded-xl p-3 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {parseError && (
          <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {parseError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-neutral-400">
          Target: <code className="text-neutral-200">/api/workflow/webhook</code>
        </span>

        <button
          onClick={handleSend}
          disabled={isExecuting}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isExecuting ? "Executing Workflow..." : "Dispatch Webhook POST"}</span>
        </button>
      </div>
    </div>
  );
}
