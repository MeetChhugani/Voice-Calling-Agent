"use client";

import React from "react";
import { CheckCircle2, Clock, MapPin, Building, ShieldCheck } from "lucide-react";
import { Lead } from "@/types";

interface RequirementsSummaryProps {
  lead: Partial<Lead>;
}

export function RequirementsSummary({ lead }: RequirementsSummaryProps) {
  const hasData =
    lead.full_name ||
    lead.property_type ||
    lead.property_city ||
    lead.style_preferences ||
    lead.phone;

  return (
    <div className="rounded-xl border border-[#18191A]/10 bg-white/70 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#18191A]/10">
        <h3 className="font-serif text-sm font-semibold tracking-wide text-[#18191A]">
          Discovered Vision & Requirements
        </h3>
        <span className="text-[10px] tracking-wider uppercase bg-[#C5A059]/15 text-[#4A5340] px-2.5 py-0.5 rounded font-medium">
          {lead.lead_status || "In Conversation"}
        </span>
      </div>

      {!hasData ? (
        <div className="text-xs text-[#18191A]/50 py-6 text-center italic">
          Requirements will be catalogued in real-time as Dhruv guides the conversation.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {lead.full_name && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Prospective Client
              </span>
              <p className="font-medium text-[#18191A] mt-0.5">{lead.full_name}</p>
            </div>
          )}

          {lead.phone && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Contact Number
              </span>
              <p className="font-medium text-[#18191A] mt-0.5 flex items-center gap-1.5">
                <span>{lead.phone}</span>
                {lead.phone_verified ? (
                  <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                    <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    Verification in progress
                  </span>
                )}
              </p>
            </div>
          )}

          {(lead.property_type || lead.property_city) && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Property & Location
              </span>
              <p className="font-medium text-[#18191A] mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#C5A059]" />
                {[lead.property_type, lead.property_location, lead.property_city]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
          )}

          {lead.project_scope && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Project Scope & Area
              </span>
              <p className="font-medium text-[#18191A] mt-0.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-[#C5A059]" />
                {[lead.project_scope, lead.property_area].filter(Boolean).join(" • ")}
              </p>
            </div>
          )}

          {lead.style_preferences && (
            <div className="md:col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Aesthetic Direction
              </span>
              <p className="font-medium text-[#18191A] mt-0.5 bg-[#F4EFE6]/60 p-2.5 rounded border border-[#18191A]/5">
                {lead.style_preferences}
              </p>
            </div>
          )}

          {lead.budget_fit !== undefined && lead.budget_fit !== null && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Request qualification
              </span>
              <p
                className={`font-medium mt-0.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${
                  lead.budget_fit
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {lead.budget_fit ? "Qualified for follow-up" : "Awaiting staff review"}
              </p>
            </div>
          )}

          {lead.preferred_meeting_times && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B775C] font-semibold block">
                Preferred Consultation Time
              </span>
              <p className="font-medium text-[#18191A] mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#C5A059]" />
                {lead.preferred_meeting_times}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
