"use client";

import React from "react";
import {
  X,
  Sliders,
  Sparkles,
  Filter,
  FileSpreadsheet,
  MessageSquare,
  Webhook,
  ShieldCheck,
  Info,
} from "lucide-react";
import { WorkflowConfig } from "@/types/workflow";

interface NodeConfigPanelProps {
  nodeId: string | null;
  config: WorkflowConfig;
  onChangeConfig: (newConfig: WorkflowConfig) => void;
  onClose: () => void;
}

export function NodeConfigPanel({
  nodeId,
  config,
  onChangeConfig,
  onClose,
}: NodeConfigPanelProps) {
  if (!nodeId) return null;

  return (
    <div className="w-full md:w-96 rounded-2xl bg-[#171D2B] border border-[#232B3E] p-5 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#232B3E]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
            Node Configuration
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* WEBHOOK CONFIG */}
      {nodeId === "node-webhook" && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <Webhook className="w-4 h-4" />
            <span className="font-semibold">Webhook Ingestion Endpoint</span>
          </div>
          <p className="text-neutral-400 text-[11px]">
            Accepts live HTTP POST inquiries from web forms, call transcripts, or external CRMs.
          </p>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Production Endpoint URL
            </label>
            <input
              readOnly
              value="/api/workflow/webhook"
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 font-mono text-[11px]"
            />
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>5-minute duplicate request prevention & Zod payload validation active.</span>
          </div>
        </div>
      )}

      {/* AI AGENT & MODEL CONFIG */}
      {(nodeId === "node-ai-agent" || nodeId === "node-chat-model") && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">AI Agent & LLM Provider</span>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Model Selection
            </label>
            <select
              value={config.aiModel.model}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  aiModel: { ...config.aiModel, model: e.target.value },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200"
            >
              <option value="gpt-4o">OpenAI GPT-4o (Production Quality)</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o-mini (Fast / Lightweight)</option>
              <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Temperature ({config.aiModel.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.aiModel.temperature}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  aiModel: { ...config.aiModel, temperature: parseFloat(e.target.value) },
                })
              }
              className="w-full"
            />
          </div>
          <div className="bg-neutral-800/60 p-2.5 rounded-lg text-[11px] text-neutral-300">
            <span className="font-semibold block text-cyan-300 mb-1">Brand Guideline:</span>
            Evaluates client inquiries against Studio Olives Cre’s ₹5 Crore investment benchmark.
          </div>
        </div>
      )}

      {/* FILTER CONFIG */}
      {nodeId === "node-filter" && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 text-blue-400">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filter Rules</span>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Target Field
            </label>
            <select
              value={config.filter.field}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  filter: { ...config.filter, field: e.target.value },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200"
            >
              <option value="budget_qualified">budget_qualified (Boolean)</option>
              <option value="estimated_budget_cr">estimated_budget_cr (Crores &ge; 5)</option>
              <option value="priority_level">priority_level (high / medium / low)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Operator
            </label>
            <select
              value={config.filter.operator}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  filter: { ...config.filter, operator: e.target.value as any },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200"
            >
              <option value="equals">Equals (==)</option>
              <option value="not_equals">Not Equals (!=)</option>
              <option value="greater_than_or_equal">Greater Than Or Equal (&ge;)</option>
              <option value="greater_than">Greater Than (&gt;)</option>
            </select>
          </div>
        </div>
      )}

      {/* APPEND ROW STORAGE CONFIG */}
      {nodeId === "node-append-row" && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-semibold">Spreadsheet Storage Adapter</span>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Storage Provider
            </label>
            <select
              value={config.storage.provider}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  storage: { ...config.storage, provider: e.target.value as any },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200"
            >
              <option value="local_csv">Local CSV Backend (No Google Auth Needed)</option>
              <option value="google_sheets">Google Sheets API (Requires Service Account)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Target File / Sheet ID
            </label>
            <input
              type="text"
              value={config.storage.targetFileOrSheet}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  storage: { ...config.storage, targetFileOrSheet: e.target.value },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 font-mono text-[11px]"
            />
          </div>
          <div className="bg-neutral-800/60 p-2.5 rounded-lg text-[11px] text-neutral-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Local CSV backend guarantees immediate offline execution without blocked Google Cloud Console logins.
            </span>
          </div>
        </div>
      )}

      {/* NOTIFICATION CONFIG */}
      {nodeId === "node-notification" && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 text-rose-400">
            <MessageSquare className="w-4 h-4" />
            <span className="font-semibold">SMS & WhatsApp Notification</span>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Dispatch Channel
            </label>
            <select
              value={config.notification.channel}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  notification: { ...config.notification, channel: e.target.value as any },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200"
            >
              <option value="whatsapp">WhatsApp Business Notification</option>
              <option value="sms">Direct SMS</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
              Recipient Phone Number
            </label>
            <input
              type="text"
              value={config.notification.recipient}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  notification: { ...config.notification, recipient: e.target.value },
                })
              }
              className="w-full bg-[#11151F] border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 font-mono text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="dryRunToggle"
              checked={config.notification.dryRun}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  notification: { ...config.notification, dryRun: e.target.checked },
                })
              }
              className="rounded bg-neutral-900 border-neutral-700 text-rose-500"
            />
            <label htmlFor="dryRunToggle" className="text-neutral-300 text-[11px] font-medium">
              Dry-run preview mode (Prevents consuming real credits)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
