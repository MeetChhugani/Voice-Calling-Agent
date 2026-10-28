"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, MapPin, Phone } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-[#18191A]/10 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-full bg-[#18191A] flex items-center justify-center text-[#DFC085] font-serif text-sm tracking-wider font-semibold shadow-sm group-hover:scale-105 transition-transform">
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
        </Link>

        {/* Public Client Luxury Navigation — Clean & Exclusive */}
        <div className="flex items-center space-x-4 text-xs tracking-wider uppercase font-medium">
          <div className="hidden sm:flex items-center gap-1.5 text-[#18191A]/70 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Naraina Vihar, New Delhi</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#4A5340] bg-[#6B775C]/10 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border border-[#6B775C]/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            <span>Tisha: AI Luxury Coordinator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
