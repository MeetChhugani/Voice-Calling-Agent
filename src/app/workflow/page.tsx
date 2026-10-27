"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Workflow,
  Sparkles,
  Database,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { NodeConfigPanel } from "@/components/workflow/NodeConfigPanel";
import { WebhookTestConsole } from "@/components/workflow/WebhookTestConsole";
import { ExecutionLogsViewer } from "@/components/workflow/ExecutionLogsViewer";
import {
  NodeExecutionStatus,
  WebhookPayload,
  WorkflowConfig,
  WorkflowExecutionResult,
} from "@/types/workflow";

export default function AutomationWorkflowPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-webhook");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [recentRecords, setRecentRecords] = useState<Record<string, string>[]>([]);
  const [recordsCount, setRecordsCount] = useState<number>(0);

  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>({
    aiModel: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.2,
    },
    filter: {
      field: "budget_qualified",
      operator: "equals",
      value: true,
    },
    storage: {
      provider: "local_csv",
      targetFileOrSheet: "leads_workflow_records.csv",
    },
    notification: {
      channel: "whatsapp",
      recipient: "+919307512816",
      messageTemplate: "Hello {{lead_name}}, your luxury consultation enquiry has been qualified.",
      dryRun: true,
    },
  });

  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeExecutionStatus>>({
    "node-webhook": "idle",
    "node-ai-agent": "idle",
    "node-filter": "idle",
    "node-append-row": "idle",
    "node-notification": "idle",
  });

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/workflow/records");
      const data = await res.json();
      setRecentRecords(data.records || []);
      setRecordsCount(data.count || 0);
    } catch (e) {
      console.error("Failed to load records", e);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleRunWorkflow = async (payload?: WebhookPayload) => {
    setIsExecuting(true);

    const testPayload = payload || {
      name: "Rohit Dhawan",
      phone: "+919307512816",
      email: "rohit@dhawan.com",
      propertyType: "Penthouse",
      budget: "6 Cr",
      timeline: "Within 2 months",
      message:
        "Need contemporary luxury interior concepts and bespoke Italian marble work for our 6,000 sq ft penthouse in Gurgaon. Budget is approximately ₹6 Cr.",
      channel: "web",
    };

    // Animate statuses to "running" sequentially
    setNodeStatuses({
      "node-webhook": "running",
      "node-ai-agent": "idle",
      "node-filter": "idle",
      "node-append-row": "idle",
      "node-notification": "idle",
    });

    try {
      const res = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: testPayload,
          config: workflowConfig,
        }),
      });

      const result: WorkflowExecutionResult = await res.json();
      setExecutionResult(result);

      // Map node statuses from logs
      const updatedStatuses: Record<string, NodeExecutionStatus> = { ...nodeStatuses };
      result.logs.forEach((log) => {
        updatedStatuses[log.nodeId] = log.status;
      });
      setNodeStatuses(updatedStatuses);

      // Refresh persisted records
      fetchRecords();
    } catch (err: unknown) {
      console.error("Execution error:", err);
      setNodeStatuses((prev) => ({ ...prev, "node-webhook": "error" }));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E121B] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="border-b border-[#232B3E] bg-[#121622]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-neutral-700/60 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300 transition-colors"
              title="Return to Tisha Voice Agent"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">
                  Automation Workflow Studio
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  v2.0 Active
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 tracking-wider block font-medium">
                Studio Olives Cre • Ingestion, AI Qualification, Spreadsheets & Alerts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/"
              className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Agent</span>
            </Link>
            <Link
              href="/admin"
              className="text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 border border-neutral-700/60 px-3 py-1.5 rounded-lg"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Top Summary Banner */}
        <div className="bg-[#171D2B] border border-[#232B3E] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-neutral-100 tracking-tight">
              Webhook &rarr; AI Agent &rarr; Filter &rarr; Append Row &rarr; Notification Pipeline
            </h1>
            <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
              Fully decoupled automation architecture. Operates with local development adapters (local CSV file append, dry-run WhatsApp notifications) without requiring Google Cloud Console login, while remaining ready for live Google Sheets and Twilio credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#11151F] border border-neutral-800 px-3 py-2 rounded-xl text-center">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Stored Leads</span>
              <strong className="text-sm font-mono text-emerald-400">{recordsCount}</strong>
            </div>
          </div>
        </div>

        {/* Workflow Diagram & Node Configuration Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 w-full">
            <WorkflowCanvas
              nodeStatuses={nodeStatuses}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onExecute={() => handleRunWorkflow()}
              isExecuting={isExecuting}
            />
          </div>

          <div className="lg:col-span-1 w-full">
            <NodeConfigPanel
              nodeId={selectedNodeId}
              config={workflowConfig}
              onChangeConfig={(c) => setWorkflowConfig(c)}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        </div>

        {/* Webhook Test Simulation Console */}
        <WebhookTestConsole
          onTrigger={(payload) => handleRunWorkflow(payload)}
          isExecuting={isExecuting}
        />

        {/* Real-time Execution Logs */}
        <ExecutionLogsViewer execution={executionResult} />

        {/* Stored CSV Rows Table */}
        <div className="bg-[#171D2B] border border-[#232B3E] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232B3E]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
                Appended Rows in Storage ({workflowConfig.storage.provider})
              </h3>
            </div>
            <button
              onClick={fetchRecords}
              className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
              title="Refresh rows"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#11151F] text-neutral-400 uppercase text-[10px] border-y border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Lead Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Budget (Cr)</th>
                  <th className="py-2.5 px-3">Qualified</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500 italic font-sans text-xs">
                      No records saved yet. Execute a test run to append a qualified row.
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-2 px-3 text-neutral-200 font-sans font-semibold">{r.lead_name}</td>
                      <td className="py-2 px-3 text-emerald-400">{r.phone}</td>
                      <td className="py-2 px-3 text-neutral-300">₹{r.estimated_budget_cr} Cr</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-sans">
                          {r.budget_qualified}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-cyan-400 uppercase text-[10px]">{r.priority_level}</td>
                      <td className="py-2 px-3 text-neutral-500 text-[10px]">{r.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
