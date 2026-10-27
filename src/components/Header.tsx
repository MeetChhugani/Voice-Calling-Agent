"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-[#18191A]/10 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#18191A] flex items-center justify-center text-[#DFC085] font-serif text-sm tracking-wider font-semibold shadow-sm">
            OC
          </div>
          <div>
            <span className="font-serif tracking-[0.25em] text-xs font-semibold uppercase text-[#18191A] block">
              Studio Olives Cre
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#6B775C] font-medium block">
              Architecture & Luxury Interiors • Est. 2016
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-6 text-xs tracking-wider uppercase font-medium">
          <div className="hidden md:flex items-center gap-1.5 text-[#4A5340] bg-[#6B775C]/10 px-3 py-1 rounded-full text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>AI Voice Coordinator: Tisha</span>
          </div>
          <Link
            href="/workflow"
            className="text-[#18191A]/80 hover:text-emerald-700 transition-colors flex items-center gap-1 border border-emerald-600/30 bg-emerald-50/60 px-3 py-1.5 rounded text-[11px] font-semibold text-emerald-900"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Automation Workflow</span>
          </Link>
          <Link
            href="/admin"
            className="text-[#18191A]/70 hover:text-[#18191A] transition-colors flex items-center gap-1 border border-[#18191A]/15 px-3 py-1.5 rounded text-[11px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Staff Portal</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
