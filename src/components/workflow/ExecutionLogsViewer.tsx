"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Activity,
} from "lucide-react";
import { NodeExecutionLog, WorkflowExecutionResult } from "@/types/workflow";

interface ExecutionLogsViewerProps {
  execution: WorkflowExecutionResult | null;
}

export function ExecutionLogsViewer({ execution }: ExecutionLogsViewerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "node-webhook": true,
    "node-ai-agent": true,
  });

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!execution) {
    return (
      <div className="w-full rounded-2xl bg-[#171D2B] border border-[#232B3E] p-8 text-center text-neutral-400 text-xs italic">
        No workflow runs yet. Trigger a webhook test above or click &ldquo;Test Run Workflow&rdquo; to view real-time node outputs.
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-[#171D2B] border border-[#232B3E] p-6 shadow-2xl flex flex-col gap-4">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#232B3E] gap-3">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
                Execution Run: {execution.executionId}
              </h3>
              <span
                className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                  execution.status === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : execution.status === "partial"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {execution.status}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Started: {new Date(execution.startedAt).toLocaleTimeString()} • Total Latency:{" "}
              <strong className="text-neutral-200">{execution.durationMs}ms</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Nodes Timeline Logs */}
      <div className="space-y-3">
        {execution.logs.map((log) => {
          const isExpanded = Boolean(expandedNodes[log.nodeId]);

          return (
            <div
              key={log.nodeId}
              className={`rounded-xl border transition-all overflow-hidden ${
                log.status === "success"
                  ? "bg-[#1B2232] border-[#2A354C]"
                  : log.status === "error"
                  ? "bg-rose-950/20 border-rose-800/40"
                  : log.status === "skipped"
                  ? "bg-[#151922] border-neutral-800 opacity-70"
                  : "bg-[#181F2E] border-neutral-700"
              }`}
            >
              <div
                onClick={() => toggleExpand(log.nodeId)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  )}

                  <span className="font-semibold text-xs text-neutral-200">{log.nodeName}</span>

                  {log.isDryRun && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                      DRY-RUN
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {log.durationMs !== undefined && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {log.durationMs}ms
                    </span>
                  )}

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      log.status === "success"
                        ? "text-emerald-400 bg-emerald-500/10"
                        : log.status === "error"
                        ? "text-rose-400 bg-rose-500/10"
                        : log.status === "skipped"
                        ? "text-neutral-400 bg-neutral-800"
                        : "text-amber-400 bg-amber-500/10"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-4 border-t border-neutral-800/80 bg-[#121620] space-y-3 text-xs font-mono">
                  {log.error && (
                    <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
                      <strong className="block text-rose-200 mb-0.5">Execution Failure:</strong>
                      {log.error}
                    </div>
                  )}

                  {log.warning && (
                    <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs">
                      {log.warning}
                    </div>
                  )}

                  {log.output !== undefined && log.output !== null && (
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                        Node Output:
                      </span>
                      <pre className="p-3 rounded-lg bg-[#0D1017] border border-neutral-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                        {JSON.stringify(log.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.input !== undefined && log.input !== null && (
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                        Node Input:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-[#0D1017]/70 border border-neutral-850 text-neutral-400 overflow-x-auto text-[10px]">
                        {JSON.stringify(log.input, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
