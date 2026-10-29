"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Sparkles,
  LogOut,
  Phone,
  FileSpreadsheet,
} from "lucide-react";
import { SupportRequest } from "@/types";

interface AdminMetrics {
  totalSessions: number;
  totalRequests: number;
  fraudAlerts: number;
  pendingCallbacks: number;
  resolvedTickets: number;
  escalatedRequests: number;
  excelRecordsCount: number;
}

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalSessions: 0,
    totalRequests: 0,
    fraudAlerts: 0,
    pendingCallbacks: 0,
    resolvedTickets: 0,
    escalatedRequests: 0,
    excelRecordsCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchData = useCallback(async (authToken: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`/api/admin/data?token=${encodeURIComponent(authToken)}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError("Invalid administrative password. Access denied.");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("soc_admin_token");
        }
        if (showLoading) setLoading(false);
        return;
      }
      const data = await res.json();
      setRequests(data.supportRequests || []);
      setMetrics(
        data.metrics || {
          totalSessions: 0,
          totalRequests: 0,
          fraudAlerts: 0,
          pendingCallbacks: 0,
          resolvedTickets: 0,
          escalatedRequests: 0,
          excelRecordsCount: 0,
        }
      );
      setIsAuthenticated(true);
      setToken(authToken);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("soc_admin_token", authToken);
      }
    } catch {
      setAuthError("Failed to fetch administrative data. Please check network connection.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const savedToken = sessionStorage.getItem("soc_admin_token");
      if (savedToken) {
        void fetchData(savedToken);
      } else {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [fetchData]);

  // Keep PolyAI-created requests visible while staff leave this dashboard open.
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const interval = window.setInterval(() => {
      void fetchData(token, false);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [fetchData, isAuthenticated, token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    fetchData(passwordInput.trim());
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken("");
    setPasswordInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("soc_admin_token");
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.issue_summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" ||
      r.category === categoryFilter ||
      (categoryFilter === "fraud" && r.is_fraud_or_urgent);

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-300">Authenticating administrative session...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(145deg, #001B36 0%, #004C8F 100%)" }}
      >
        <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-xl shadow"
              style={{ backgroundColor: "#FFFFFF", color: "#004C8F" }}
            >
              H
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">HDFC Bank Service Desk</h1>
              <p className="text-xs text-blue-300">Staff & Management Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Administrative Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter authorized password"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-xs text-red-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:brightness-110 active:scale-98"
              style={{ backgroundColor: "#ED1C24" }}
            >
              Access Dashboard
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-blue-300 hover:text-white flex items-center justify-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Caller Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-lg shadow"
            style={{ backgroundColor: "#FFFFFF", color: "#004C8F" }}
          >
            H
          </div>
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              HDFC Bank Voice Operations
              <span className="bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full">
                Operations Desk
              </span>
            </div>
            <div className="text-xs text-slate-400">Dhruv Voice Assistance · Real-time Support Requests</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/export-excel"
            download
            className="flex items-center gap-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export HDFC Excel (.xlsx)</span>
          </a>

          <Link
            href="/workflow"
            className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Workflow Studio</span>
          </Link>

          <button
            onClick={() => fetchData(token)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            {
              label: "Total Requests",
              value: metrics.totalRequests,
              color: "text-blue-400",
              border: "border-blue-500/30",
            },
            {
              label: "Fraud / Urgent",
              value: metrics.fraudAlerts,
              color: "text-red-400",
              border: "border-red-500/30",
            },
            {
              label: "Pending Callback",
              value: metrics.pendingCallbacks,
              color: "text-amber-400",
              border: "border-amber-500/30",
            },
            {
              label: "Escalated",
              value: metrics.escalatedRequests,
              color: "text-purple-400",
              border: "border-purple-500/30",
            },
            {
              label: "Resolved",
              value: metrics.resolvedTickets,
              color: "text-emerald-400",
              border: "border-emerald-500/30",
            },
            {
              label: "Excel Synced",
              value: metrics.excelRecordsCount,
              color: "text-teal-400",
              border: "border-teal-500/30",
            },
          ].map((m, idx) => (
            <div
              key={idx}
              className={`bg-slate-900/80 border ${m.border} rounded-2xl p-4 flex flex-col justify-between shadow-sm`}
            >
              <span className="text-xs text-slate-400 font-medium">{m.label}</span>
              <span className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, ticket ID..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="accounts">Accounts</option>
              <option value="cards">Cards</option>
              <option value="loans">Loans</option>
              <option value="deposits">Fixed Deposits</option>
              <option value="digital_banking">Digital Banking</option>
              <option value="fraud">Fraud / Urgent</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Customer Service Requests</span>
              <span className="text-xs text-slate-400 font-normal">({filteredRequests.length} matching)</span>
            </h2>
            <Link href="/" className="text-xs text-blue-400 hover:text-blue-300">
              Open Caller Interface →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Issue Summary</th>
                  <th className="px-4 py-3">Callback Time</th>
                  <th className="px-4 py-3">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No service requests match the current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">{req.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{req.customer_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {req.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] capitalize">
                          {req.category?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            req.status === "escalated"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : req.status === "resolved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : req.status === "in_progress"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {req.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs text-slate-300 truncate" title={req.issue_summary}>
                        {req.issue_summary}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {req.preferred_callback_time || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
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
