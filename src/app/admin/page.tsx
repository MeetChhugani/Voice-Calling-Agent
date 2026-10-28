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
  Sparkles,
  LogOut,
} from "lucide-react";
import { Lead, Meeting } from "@/types";

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
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
    setAuthError(null);
    try {
      const res = await fetch(`/api/admin/data?token=${encodeURIComponent(authToken)}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError("Invalid staff password. Please try again.");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("soc_admin_token");
        }
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem("soc_admin_token", authToken);
      }
    } catch (e) {
      console.error("Admin fetch error:", e);
      setAuthError("Failed to connect to administrative server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if session token already saved in browser
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("soc_admin_token") : null;
    if (saved) {
      setToken(saved);
      fetchData(saved);
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setToken(passwordInput);
    fetchData(passwordInput);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("soc_admin_token");
    }
    setToken("");
    setPasswordInput("");
    setIsAuthenticated(false);
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
          <div className="w-12 h-12 rounded-full bg-[#18191A] text-[#DFC085] flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#6B775C] font-semibold block">
              Studio Olives Cre
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#18191A] mt-1">
              Staff Portal Access
            </h2>
            <p className="text-xs text-[#18191A]/60 mt-1">
              Authorized Consultation Management & Master Database
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl text-left">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#18191A]/70 block mb-1.5">
                Staff Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-[#18191A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#18191A] text-[#DFC085] text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#2A2B2D] transition-colors shadow-sm"
            >
              {loading ? "Authenticating..." : "Authenticate Staff Access"}
            </button>
          </form>

          <div className="pt-2 border-t border-[#18191A]/10 flex justify-center">
            <Link
              href="/"
              className="text-xs text-[#6B775C] hover:text-[#18191A] flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Client Voice Interface
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#18191A]/10 bg-white/90 backdrop-blur-md sticky top-0 z-40">
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
                VIP Consultation & Lead Intelligence (Staff Portal)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Automation Workflow Studio Link */}
            <Link
              href="/workflow"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 text-emerald-900 text-xs font-semibold tracking-wider uppercase hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Open Automation Workflow Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Automation Workflow</span>
            </Link>

            {/* Authenticated Excel Export */}
            <a
              href={`/api/admin/export-excel?token=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm"
              title="Download appointments as genuine Microsoft Excel (.xlsx) file"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Master Excel</span>
            </a>

            {isFallback && (
              <span className="hidden lg:inline text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                Live Memory Fallback
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
              onClick={handleLogout}
              className="text-xs text-red-700 hover:text-red-900 border border-red-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              title="Sign Out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
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
            <p className="font-serif text-2xl font-bold text-emerald-700 mt-2">
              {metrics.qualifiedLeads}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Confirmed</span>
              <Calendar className="w-4 h-4 text-[#C5A059]" />
            </div>
            <p className="font-serif text-2xl font-bold text-[#18191A] mt-2">
              {metrics.confirmedMeetings}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Link</span>
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
            <p className="font-serif text-2xl font-bold text-[#18191A] mt-2">
              {metrics.excelRecordsCount}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#18191A]/10 shadow-sm">
            <div className="flex items-center justify-between text-[#6B775C]">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Conversion</span>
              <Building className="w-4 h-4 text-[#C5A059]" />
            </div>
            <p className="font-serif text-2xl font-bold text-[#18191A] mt-2">
              {metrics.totalLeads > 0
                ? `${Math.round((metrics.confirmedMeetings / metrics.totalLeads) * 100)}%`
                : "100%"}
            </p>
          </div>
        </div>

        {/* Master Excel Appointments Section */}
        <section className="bg-white rounded-2xl border border-[#18191A]/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#18191A]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#18191A] flex items-center gap-2">
                <FileDown className="w-5 h-5 text-emerald-600" />
                <span>Client Consultations & Appointments Table</span>
              </h2>
              <p className="text-xs text-[#18191A]/60 mt-0.5">
                Every consultation booked by phone or voice is logged here and exported into the master Excel sheet.
              </p>
            </div>
            <a
              href={`/api/admin/export-excel?token=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Download studio_olives_cre_master_appointments.xlsx</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#18191A] text-[#DFC085] uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Appt ID</th>
                  <th className="p-3.5">Client Name</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Property Scope</th>
                  <th className="p-3.5">Budget</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Meet Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18191A]/5 text-[#18191A]/80 font-normal">
                {excelAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-[#18191A]/50 italic">
                      No consultations logged yet. Complete a consultation via phone to see real-time updates.
                    </td>
                  </tr>
                ) : (
                  excelAppointments.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-3.5 font-mono text-[11px] font-semibold text-[#18191A]">
                        {row.AppointmentID}
                      </td>
                      <td className="p-3.5 font-medium text-[#18191A]">
                        {row.ClientName}
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        <div>{row.PhoneNumber}</div>
                        <div className="text-[10px] text-neutral-400">{row.Email}</div>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <span className="font-medium text-[#18191A] block">{row.PropertyType}</span>
                        <span className="text-[10px] text-[#6B775C] truncate block">{row.CityLocation}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#C5A059]/15 text-[#8F7034]">
                          {row.Budget}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px]">
                        {row.ConsultationDateTime}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.MeetingStatus === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.MeetingStatus}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {row.GoogleMeetUrl && !row.GoogleMeetUrl.includes("Pending") ? (
                          <a
                            href={row.GoogleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>Open Meet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-amber-700/80 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                            Concierge Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Database Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#18191A]/40" />
            <input
              type="text"
              placeholder="Search by client, phone, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#18191A]/10 rounded-xl text-xs text-[#18191A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#18191A]/60 uppercase tracking-wider font-semibold">
              Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#18191A]/10 rounded-xl px-3 py-2 text-xs text-[#18191A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="all">All Statuses</option>
              <option value="qualified">Qualified (₹5 Cr+)</option>
              <option value="booked">Booked</option>
              <option value="qualifying">In Qualification</option>
              <option value="new_lead">New Inquiries</option>
            </select>
          </div>
        </div>

        {/* Complete Leads Master Table */}
        <section className="bg-white rounded-2xl border border-[#18191A]/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#18191A]/10">
            <h2 className="font-serif text-lg font-bold text-[#18191A]">
              Client Records & Qualification Database
            </h2>
            <p className="text-xs text-[#18191A]/60 mt-0.5">
              Comprehensive internal log of all high-net-worth client inquiries discovered by Tisha.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4EFE6] text-[#18191A]/70 uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Client Profile</th>
                  <th className="p-3.5">Property & Location</th>
                  <th className="p-3.5">Budget Benchmark</th>
                  <th className="p-3.5">Qualification</th>
                  <th className="p-3.5">Project Scope</th>
                  <th className="p-3.5">Call Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18191A]/5 text-[#18191A]/80 font-normal">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[#18191A]/50 italic">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-3.5 font-medium text-[#18191A]">
                        <div>{lead.full_name || "Private Client"}</div>
                        <div className="font-mono text-[11px] text-[#6B775C] mt-0.5">{lead.phone}</div>
                        {lead.email && <div className="text-[10px] text-neutral-400">{lead.email}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-[#18191A] block">
                          {lead.property_type || "Luxury Residence"}
                        </span>
                        <span className="text-[10px] text-[#6B775C] block">
                          {[lead.property_location, lead.property_city].filter(Boolean).join(", ") || "Delhi NCR"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-[#18191A] block">
                          {lead.budget_notes || "₹5 Cr+ Benchmark"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.budget_fit || lead.lead_status === "qualified" || lead.lead_status === "booked"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {lead.lead_status ? lead.lead_status.toUpperCase() : "QUALIFYING"}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-[200px] truncate text-[11px]">
                        {lead.project_scope || "Architecture & Turnkey Interiors"}
                      </td>
                      <td className="p-3.5 max-w-[260px] text-[11px] text-[#18191A]/70 leading-relaxed">
                        {lead.call_summary || "Inquiry recorded through voice agent consultation."}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
