"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  FileDown,
} from "lucide-react";
import { Lead, Meeting } from "@/types";

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string>("studio-olives-cre-2026");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    confirmedMeetings: 0,
    pendingRequests: 0,
    failedBookings: 0,
    excelRecordsCount: 0,
  });
  const [excelAppointments, setExcelAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFallback, setIsFallback] = useState(false);

  const fetchData = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data?token=${encodeURIComponent(authToken)}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLeads(data.leads || []);
      setMeetings(data.meetings || []);
      setExcelAppointments(data.excelAppointments || []);
      setMetrics(data.metrics || {});
      setIsFallback(Boolean(data.isFallback));
      setIsAuthenticated(true);
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(token);
  }, [token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setToken(passwordInput);
    fetchData(passwordInput);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.property_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.property_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || lead.lead_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#18191A]/10 shadow-lg text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-[#18191A] text-[#DFC085] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#18191A]">
              Staff Portal Access
            </h2>
            <p className="text-xs text-[#18191A]/60 mt-1">
              Studio Olives Cre Authorized Consultation Dashboard
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter admin password (default: studio-olives-cre-2026)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-[#18191A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#18191A] text-[#DFC085] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#2A2B2D] transition-colors"
            >
              Authenticate
            </button>
          </form>
          <Link
            href="/"
            className="text-xs text-[#6B775C] hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Voice Consultation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-[#18191A]/10 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-[#18191A]/10 hover:bg-[#F4EFE6] transition-colors"
              title="Return to client interface"
            >
              <ArrowLeft className="w-4 h-4 text-[#18191A]" />
            </Link>
            <div>
              <span className="font-serif font-bold text-sm tracking-wider uppercase text-[#18191A]">
                Studio Olives Cre
              </span>
              <span className="text-[10px] text-[#6B775C] uppercase tracking-widest block font-medium">
                VIP Consultation & Lead Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/api/admin/export-excel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm"
              title="Download appointments as real Microsoft Excel (.xlsx) file"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </a>
            {isFallback && (
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                Live In-Memory Fallback Active
              </span>
            )}
            <button
              onClick={() => fetchData(token)}
              className="p-2 border border-[#18191A]/10 rounded-lg hover:bg-[#F4EFE6] transition-colors text-[#18191A]"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-[#18191A]/60 hover:text-red-700 tracking-wider uppercase font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Total Leads</span>
              <Users className="w-4 h-4 text-[#C5A059]" />
            </div>
            <p className="font-serif text-2xl font-bold text-[#18191A] mt-2">
              {metrics.totalLeads}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Qualified (₹5 Cr+)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-emerald-800 mt-2">
              {metrics.qualifiedLeads}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Confirmed Meetings</span>
              <Calendar className="w-4 h-4 text-[#4A5340]" />
            </div>
            <p className="font-serif text-2xl font-bold text-[#4A5340] mt-2">
              {metrics.confirmedMeetings}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-amber-700 mt-2">
              {metrics.pendingRequests}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Excel Records</span>
              <FileDown className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-emerald-800 mt-2">
              {metrics.excelRecordsCount}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Attention Needed</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-rose-700 mt-2">
              {metrics.failedBookings}
            </p>
          </div>
        </div>

        {/* Lead Search and Filters */}
        <div className="bg-white rounded-2xl border border-[#18191A]/10 p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#18191A]/40 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search leads by name, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-[#18191A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto">
              {["all", "booked", "booking_pending", "qualified", "qualifying"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-[#18191A] text-[#DFC085] border-[#18191A]"
                      : "bg-[#FDFBF7] text-[#18191A]/70 border-[#18191A]/15 hover:bg-neutral-100"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Lead List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EFE6]/70 border-y border-[#18191A]/10 text-[#6B775C] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Phone (Verified)</th>
                  <th className="py-3 px-4">Property & City</th>
                  <th className="py-3 px-4">Scope & Style</th>
                  <th className="py-3 px-4">Budget Fit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Consultation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18191A]/5">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#18191A]/40 italic">
                      No leads matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const meeting = meetings.find((m) => m.lead_id === lead.id);

                    return (
                      <tr key={lead.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-[#18191A]">
                          <div>{lead.full_name}</div>
                          {lead.email && (
                            <span className="text-[10px] text-[#6B775C] block">{lead.email}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span>{lead.phone}</span>
                            {lead.phone_verified ? (
                              <span title="Digit-by-digit verified">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded">unverified</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#C5A059]" />
                            <span>{[lead.property_type, lead.property_city].filter(Boolean).join(" • ") || "—"}</span>
                          </div>
                          {lead.property_area && (
                            <span className="text-[10px] text-[#6B775C] block">{lead.property_area}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="truncate text-[#18191A]/80 font-serif" title={lead.style_preferences || ""}>
                            {lead.style_preferences || lead.project_scope || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          {lead.budget_fit ? (
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ₹5 Cr+ Aligned
                            </span>
                          ) : lead.budget_fit === false ? (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Budget Discussion
                            </span>
                          ) : (
                            <span className="text-[#18191A]/40">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium ${
                              lead.lead_status === "booked"
                                ? "bg-emerald-100 text-emerald-800"
                                : lead.lead_status === "booking_pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {lead.lead_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {meeting?.meeting_url ? (
                            <a
                              href={meeting.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium underline"
                            >
                              <span>Meet Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : meeting ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              Pending Google Sync
                            </span>
                          ) : (
                            <span className="text-[#18191A]/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
