"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-[#18191A]/10 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#004C8F] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            H
          </div>
          <div>
            <span className="font-serif tracking-[0.25em] text-xs font-semibold uppercase text-[#18191A] block">
              HDFC Bank
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#6B775C] font-medium block">
              Customer assistance prototype
            </span>
          </div>
        </Link>

        {/* Public Client Luxury Navigation — Clean & Exclusive */}
        <div className="flex items-center space-x-4 text-xs tracking-wider uppercase font-medium">
          <div className="flex items-center gap-1.5 text-[#4A5340] bg-[#6B775C]/10 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border border-[#6B775C]/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-3 h-3 text-[#C5A059]" />
            <span>Tisha: Voice Assistance</span>
          </div>
        </div>
      </div>
    </header>
  );
}
