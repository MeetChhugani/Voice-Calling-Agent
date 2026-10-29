"use client";

import React from "react";
import {
  Webhook,
  Bot,
  Filter,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Play,
  Settings,
} from "lucide-react";
import { NodeExecutionStatus } from "@/types/workflow";

interface WorkflowCanvasProps {
  nodeStatuses: Record<string, NodeExecutionStatus>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
}

export function WorkflowCanvas({
  nodeStatuses,
  selectedNodeId,
  onSelectNode,
  onExecute,
  isExecuting,
}: WorkflowCanvasProps) {
  const getStatusBadge = (status: NodeExecutionStatus = "idle") => {
    switch (status) {
      case "running":
        return (
          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
            <Clock className="w-3 h-3" />
          </span>
        );
      case "success":
        return (
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
        );
      case "error":
        return (
          <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
        );
      case "skipped":
        return (
          <span className="w-5 h-5 rounded-full bg-neutral-700 text-neutral-400 flex items-center justify-center text-[10px]">
            —
          </span>
        );
      default:
        return (
          <span className="w-5 h-5 rounded-full bg-[#2A303C] text-neutral-400 flex items-center justify-center">
            <Check className="w-3 h-3 opacity-40" />
          </span>
        );
    }
  };

  const getBorderColor = (nodeId: string, status: NodeExecutionStatus = "idle") => {
    if (selectedNodeId === nodeId) return "border-emerald-400 ring-2 ring-emerald-400/20 shadow-lg shadow-emerald-500/10";
    if (status === "running") return "border-amber-400 animate-pulse";
    if (status === "success") return "border-emerald-500/80";
    if (status === "error") return "border-rose-500/80";
    if (status === "skipped") return "border-neutral-700/60 opacity-60";
    return "border-[#2E384D]";
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#131722] border border-[#232B3E] overflow-hidden shadow-2xl p-6 select-none">
      {/* Subtle Grid Background resembling reference */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#4ADE80 0.75px, transparent 0.75px), radial-gradient(#60A5FA 0.75px, #131722 0.75px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
      />

      {/* Canvas Top Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between pb-6 border-b border-[#232B3E] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold tracking-wide text-neutral-100 uppercase">
              Workflow Graph: HDFC Bank Request Pipeline
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Webhook &rarr; AI Agent (GPT-4o) &rarr; Filter &rarr; Append Row (Local/Sheets) &rarr; SMS/WhatsApp Notification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
              isExecuting
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait"
                : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold active:scale-95 cursor-pointer"
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? "animate-spin" : ""}`} />
            <span>{isExecuting ? "Executing Pipeline..." : "Test Run Workflow"}</span>
          </button>
        </div>
      </div>

      {/* Nodes Diagram Visual Area */}
      <div className="relative z-10 py-12 px-4 overflow-x-auto min-h-[460px] flex items-center">
        <div className="min-w-[980px] w-full flex items-center justify-between gap-4 relative">
          {/* SVG Connecting Curved Wires */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {/* Wire 1: Webhook to AI Agent */}
            <path
              d="M 120 180 C 180 180, 180 160, 240 160"
              fill="none"
              stroke={nodeStatuses["node-webhook"] === "success" ? "#10B981" : "#334155"}
              strokeWidth="2.5"
              strokeDasharray={nodeStatuses["node-webhook"] === "running" ? "4 4" : "none"}
            />
            {/* Sub-wire: Chat Model to AI Agent */}
            <path
              d="M 280 290 C 280 230, 310 210, 310 190"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Sub-wire: Output Parser to AI Agent */}
            <path
              d="M 440 290 C 440 230, 420 210, 420 190"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Wire 2: AI Agent to Filter */}
            <path
              d="M 480 160 C 520 160, 520 160, 560 160"
              fill="none"
              stroke={nodeStatuses["node-ai-agent"] === "success" ? "#10B981" : "#334155"}
              strokeWidth="2.5"
            />
            {/* Wire 3: Filter to Append Row */}
            <path
              d="M 645 160 C 675 160, 675 160, 705 160"
              fill="none"
              stroke={nodeStatuses["node-filter"] === "success" ? "#10B981" : "#334155"}
              strokeWidth="2.5"
            />
            {/* Wire 4: Append Row to Notification */}
            <path
              d="M 800 160 C 830 160, 830 160, 860 160"
              fill="none"
              stroke={nodeStatuses["node-append-row"] === "success" ? "#10B981" : "#334155"}
              strokeWidth="2.5"
            />
          </svg>

          {/* NODE 1: Webhook Node */}
          <div
            onClick={() => onSelectNode("node-webhook")}
            className={`relative z-10 w-28 bg-[#1B2232] rounded-2xl p-3.5 border transition-all cursor-pointer hover:scale-105 ${getBorderColor(
              "node-webhook",
              nodeStatuses["node-webhook"]
            )}`}
            style={{ transform: "translateY(20px)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Webhook className="w-4 h-4" />
              </div>
              {getStatusBadge(nodeStatuses["node-webhook"])}
            </div>
            <h4 className="text-xs font-semibold text-neutral-200">Webhook</h4>
            <span className="text-[10px] text-emerald-400/80 font-mono block mt-1">POST :active</span>
            {/* Output connector pin */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-emerald-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>

          {/* NODE 2: AI Agent Box */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              onClick={() => onSelectNode("node-ai-agent")}
              className={`w-60 bg-[#1A2234] rounded-2xl p-4 border transition-all cursor-pointer hover:scale-105 ${getBorderColor(
                "node-ai-agent",
                nodeStatuses["node-ai-agent"]
              )}`}
            >
              {/* Left input pin */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-emerald-400 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">AI Agent</h4>
                </div>
                {getStatusBadge(nodeStatuses["node-ai-agent"])}
              </div>
              <p className="text-[10px] text-neutral-400">Structured Lead Qualifier</p>

              {/* Internal Sub-components indicator */}
              <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[9px] text-neutral-400">
                <span className="text-emerald-400 font-mono">Chat Model *</span>
                <span>Memory</span>
                <span>Output Parser</span>
              </div>

              {/* Right output pin */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-emerald-400 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Sub-node attachers below AI Agent (OpenAI Model & Parser) */}
            <div className="flex items-center justify-between w-full mt-10 px-2">
              {/* OpenAI Chat Model Node */}
              <div
                onClick={() => onSelectNode("node-chat-model")}
                className={`w-28 bg-[#181F2E] rounded-xl p-2.5 border transition-all text-center cursor-pointer hover:scale-105 ${getBorderColor(
                  "node-chat-model"
                )}`}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-300 block">OpenAI GPT-4o</span>
                <span className="text-[8px] text-neutral-500 uppercase">Chat Model</span>
              </div>

              {/* Structured Output Parser Node */}
              <div
                onClick={() => onSelectNode("node-output-parser")}
                className={`w-28 bg-[#181F2E] rounded-xl p-2.5 border transition-all text-center cursor-pointer hover:scale-105 ${getBorderColor(
                  "node-output-parser"
                )}`}
              >
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-1">
                  <span className="text-xs font-mono font-bold">&lt;/&gt;</span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-300 block">Structured Parser</span>
                <span className="text-[8px] text-neutral-500 uppercase">JSON Validator</span>
              </div>
            </div>
          </div>

          {/* NODE 3: Filter Node */}
          <div
            onClick={() => onSelectNode("node-filter")}
            className={`relative z-10 w-24 bg-[#1B2232] rounded-2xl p-3 border transition-all cursor-pointer hover:scale-105 ${getBorderColor(
              "node-filter",
              nodeStatuses["node-filter"]
            )}`}
          >
            {/* Input pin */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-cyan-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Filter className="w-4 h-4" />
              </div>
              {getStatusBadge(nodeStatuses["node-filter"])}
            </div>
            <h4 className="text-xs font-semibold text-neutral-200">Filter</h4>
            <span className="text-[9px] text-neutral-400 block mt-1">Staff review</span>

            {/* Output pin */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-blue-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </div>
          </div>

          {/* NODE 4: Append row in sheet */}
          <div
            onClick={() => onSelectNode("node-append-row")}
            className={`relative z-10 w-28 bg-[#1B2232] rounded-2xl p-3 border transition-all cursor-pointer hover:scale-105 ${getBorderColor(
              "node-append-row",
              nodeStatuses["node-append-row"]
            )}`}
          >
            {/* Input pin */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-emerald-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              {getStatusBadge(nodeStatuses["node-append-row"])}
            </div>
            <h4 className="text-xs font-semibold text-neutral-200">Append row</h4>
            <span className="text-[9px] text-neutral-400 block mt-1">Local CSV / Sheet</span>

            {/* Output pin */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-emerald-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>

          {/* NODE 5: Notification Node (SMS / WhatsApp) */}
          <div
            onClick={() => onSelectNode("node-notification")}
            className={`relative z-10 w-32 bg-[#1B2232] rounded-2xl p-3.5 border transition-all cursor-pointer hover:scale-105 ${getBorderColor(
              "node-notification",
              nodeStatuses["node-notification"]
            )}`}
          >
            {/* Input pin */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#131722] border-2 border-rose-400 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              {getStatusBadge(nodeStatuses["node-notification"])}
            </div>
            <h4 className="text-xs font-semibold text-neutral-200 truncate">SMS / WhatsApp</h4>
            <span className="text-[9px] text-rose-400 font-mono block mt-1">send: notification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
