// mobile_app\app\(main)\dashboard\competitors\page.tsx

// mobile_app/app/(main)/dashboard/competitors/page.tsx
//
// Competitor Analysis — Nearby businesses from Google Maps
// Fetches: GET /api/google/competitor-analysis?locationId=&radius=
// Shows: rank position, rating gap to #1, per-competitor cards, radar chart

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  MapPin, Star, MessageSquare, Globe, Phone,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Trophy, Target, Zap, Brain, Sparkles, RefreshCw,
  ArrowUpRight, Navigation, Clock, DollarSign,
  Shield, Eye, BarChart2, Users, CheckCircle2,
  AlertCircle, Award, Flame, Activity, Lock,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   TYPES (mirror the API response)
══════════════════════════════════════════════════════════════════ */
interface Competitor {
  placeId:        string;
  name:           string;
  address:        string;
  rating:         number;
  reviewCount:    number;
  isOpen:         boolean | null;
  photoRef:       string | null;
  distance:       number;
  compositeScore: number;
  rank:           number;
  isOwn:          boolean;
  lat:            number;
  lng:            number;
  primaryType:    string;
  priceLevel:     number | null;
  website:        string | null;
  phone:          string | null;
}

interface CompetitorAnalysisData {
  success:     boolean;
  own:         Competitor;
  competitors: Competitor[];
  all:         Competitor[];
  meta: {
    searchRadius:  number;
    totalFound:    number;
    ownRank:       number;
    topRank:       number;
    ratingGap:     number;
    reviewGap:     number;
    locationName:  string;
    category:      string;
    searchedAt:    string;
  };
}

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function rankColor(rank: number): string {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#f97316";
  return "#3b82f6";
}

function rankBg(rank: number, dark: boolean): string {
  if (rank === 1) return dark ? "rgba(245,158,11,0.12)"  : "rgba(245,158,11,0.1)";
  if (rank === 2) return dark ? "rgba(148,163,184,0.1)"  : "rgba(148,163,184,0.08)";
  if (rank === 3) return dark ? "rgba(249,115,22,0.12)"  : "rgba(249,115,22,0.08)";
  return dark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)";
}

function priceDots(level: number | null): string {
  if (level === null) return "";
  return "₹".repeat(level + 1);
}

function getPhotoUrl(ref: string, key: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=120&photo_reference=${ref}&key=${key}`;
}

/* ══════════════════════════════════════════════════════════════════
   STAR ROW
══════════════════════════════════════════════════════════════════ */
function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5 items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 10 10">
            <defs>
              <linearGradient id={`sg-${i}-${rating}`}>
                <stop offset={`${fill * 100}%`} stopColor="#f59e0b" />
                <stop offset={`${fill * 100}%`} stopColor="#334155" />
              </linearGradient>
            </defs>
            <polygon
              points="5,0.5 6.5,4 10,4 7.2,6.3 8.1,9.8 5,7.8 1.9,9.8 2.8,6.3 0,4 3.5,4"
              fill={`url(#sg-${i}-${rating})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RANK BADGE
══════════════════════════════════════════════════════════════════ */
function RankBadge({ rank, large = false }: { rank: number; large?: boolean }) {
  const color = rankColor(rank);
  const icon  = rank === 1 ? <Trophy size={large ? 14 : 10}/> : rank <= 3 ? <Award size={large ? 14 : 10}/> : null;
  return (
    <div
      className={`flex items-center gap-1 font-black rounded-full shrink-0 ${large ? "px-3 py-1.5 text-[13px]" : "px-2 py-0.5 text-[10px]"}`}
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {icon}#{rank}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RADIAL SCORE BAR
══════════════════════════════════════════════════════════════════ */
function ScoreBar({ score, max = 100, color }: { score: number; max?: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      <span className="text-[9px] font-black w-6 text-right shrink-0" style={{ color }}>{pct}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OWN RANK HERO
══════════════════════════════════════════════════════════════════ */
function RankHero({ data, dark }: { data: CompetitorAnalysisData; dark: boolean }) {
  const { own, meta, all } = data;
  const top1    = all.find(c => c.rank === 1);
  const gapAbs  = Math.abs(meta.ratingGap);
  const behind  = meta.ratingGap <= 0 && own.rank !== 1;
  const isFirst = own.rank === 1;

  // Podium data: up to rank 3
  const podium = all.slice(0, Math.min(3, all.length));

  return (
    <div
      className={`rounded-3xl border overflow-hidden mb-5 ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-100 shadow-sm"}`}
      style={{ boxShadow: dark ? "0 20px 80px rgba(59,130,246,0.12)" : "0 8px 40px rgba(59,130,246,0.08)" }}
    >
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)" }} />

      {/* hero numbers */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Your Position
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[54px] font-black leading-none text-blue-500" style={{ letterSpacing: "-0.06em" }}>
                #{own.rank}
              </span>
              <div className="flex flex-col gap-1">
                <span className={`text-[12px] font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  in your area
                </span>
                <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  out of {meta.totalFound} businesses
                </span>
              </div>
            </div>
          </div>

          {/* Gap pill */}
          <div className="flex flex-col items-end gap-2">
            {!isFirst && top1 && (
              <div
                className="flex flex-col items-center px-3 py-2.5 rounded-2xl border"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                <span className="text-[10px] font-bold text-red-400 mb-0.5">Behind #1</span>
                <span className="text-[22px] font-black leading-none text-red-400" style={{ letterSpacing: "-0.04em" }}>
                  {gapAbs.toFixed(1)}★
                </span>
                <span className="text-[9px] text-red-400/60">{Math.abs(meta.reviewGap)} reviews</span>
              </div>
            )}
            {isFirst && (
              <div
                className="flex flex-col items-center px-3 py-2.5 rounded-2xl border"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
              >
                <Trophy size={20} className="text-amber-400 mb-1" />
                <span className="text-[11px] font-black text-emerald-400">#1 Leader</span>
              </div>
            )}
          </div>
        </div>

        {/* podium bars */}
        <div className={`rounded-2xl border p-3 ${dark ? "bg-blue-950/30 border-blue-900/30" : "bg-blue-50/50 border-blue-100"}`}>
          <p className={`text-[9.5px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}>
            Local Ranking Podium
          </p>
          <div className="flex items-end justify-center gap-3">
            {/* bars for top 3 */}
            {[
              { rank: 2, height: 52 },
              { rank: 1, height: 72 },
              { rank: 3, height: 40 },
            ].map(({ rank, height }) => {
              const biz   = all.find(c => c.rank === rank);
              const color = rankColor(rank);
              const isMe  = biz?.isOwn ?? false;
              return (
                <div key={rank} className="flex flex-col items-center gap-1.5 flex-1">
                  {isMe && (
                    <div
                      className="px-2 py-0.5 rounded-full text-[8px] font-black"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                    >YOU</div>
                  )}
                  <div
                    className="w-full rounded-t-xl flex items-end justify-center pb-1.5 transition-all duration-700"
                    style={{ height, background: isMe ? color : `${color}40`, boxShadow: isMe ? `0 0 16px ${color}50` : "none" }}
                  >
                    <span className={`text-[9px] font-black ${isMe ? "text-white" : ""}`} style={{ color: isMe ? "#fff" : color }}>
                      #{rank}
                    </span>
                  </div>
                  <p className={`text-[8px] font-medium text-center truncate w-full ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    {biz ? (biz.name.length > 10 ? biz.name.slice(0, 9) + "…" : biz.name) : "—"}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <Star size={7} className="text-amber-400 fill-amber-400" />
                    <span className={`text-[8px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>
                      {biz?.rating.toFixed(1) ?? "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* stat row */}
      <div className={`border-t grid grid-cols-3 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
        {[
          { label: "Your Rating", value: own.rating > 0 ? `${own.rating.toFixed(1)}★` : "—", color: "#f59e0b" },
          { label: "Reviews",     value: own.reviewCount > 0 ? String(own.reviewCount) : "—", color: "#3b82f6" },
          { label: "Score",       value: `${Math.round(own.compositeScore)}%`, color: "#22c55e" },
        ].map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center py-3 gap-0.5 border-r last:border-r-0 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}
          >
            <span className="text-[18px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
            <span className={`text-[9px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INSIGHT CARDS
══════════════════════════════════════════════════════════════════ */
function InsightCards({ data, dark }: { data: CompetitorAnalysisData; dark: boolean }) {
  const { own, all, meta } = data;
  const top1 = all.find(c => c.rank === 1);
  const insights: { icon: React.ReactNode; color: string; title: string; text: string; tag: string }[] = [];

  if (own.rank === 1) {
    insights.push({ icon: <Trophy size={13}/>, color: "#f59e0b", title: "You're the local leader", text: `You outrank all ${meta.totalFound - 1} nearby competitors. Maintain your position by posting weekly and keeping review responses under 48 hours.`, tag: "Leading" });
  } else {
    if (top1) {
      insights.push({ icon: <TrendingUp size={13}/>, color: "#3b82f6", title: `${Math.abs(meta.ratingGap).toFixed(1)}★ gap to close`, text: `${top1.name} leads with ${top1.rating.toFixed(1)}★. Each 0.1★ improvement in rating increases click-through by ~3.5%. Focus on getting 5★ reviews.`, tag: "Rating Gap" });
    }
  }

  const belowAvgReviews = all.filter(c => !c.isOwn && c.reviewCount < own.reviewCount);
  if (belowAvgReviews.length > 0) {
    insights.push({ icon: <Star size={13}/>, color: "#4ade80", title: `Review volume advantage`, text: `You have more reviews than ${belowAvgReviews.length} nearby competitor${belowAvgReviews.length > 1 ? "s" : ""}. Reviews are a primary local ranking signal — maintain your cadence.`, tag: "Strength" });
  }

  const withWebsite  = all.filter(c => !c.isOwn && c.website).length;
  const withoutSite  = all.filter(c => !c.isOwn && !c.website).length;
  if (withoutSite > 0 && own.website) {
    insights.push({ icon: <Globe size={13}/>, color: "#a78bfa", title: `Website advantage`, text: `${withoutSite} competitor${withoutSite > 1 ? "s have" : " has"} no website. Your website link gives you an extra conversion point that competitors lack.`, tag: "Advantage" });
  }

  if (meta.ratingGap < -0.3 && top1) {
    const reviewsNeeded = Math.ceil((top1.rating * top1.reviewCount - own.rating * own.reviewCount) / (5 - own.rating));
    insights.push({ icon: <Zap size={13}/>, color: "#fb923c", title: `${Math.max(5, reviewsNeeded)} 5★ reviews to overtake`, text: `If all new reviews are 5★, you need approximately ${Math.max(5, reviewsNeeded)} more reviews to surpass ${top1.name}'s current rating.`, tag: "Action" });
  }

  return (
    <div className={`rounded-2xl border overflow-hidden mb-5 ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}>
          <Brain size={12} style={{ color: "#60a5fa" }} />
        </div>
        <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.02em" }}>AI Competitive Insights</p>
        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[9px] font-black text-blue-400">Live</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {insights.slice(0, 3).map((ins, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${dark ? "bg-white/[0.02] border-white/[0.04]" : "bg-slate-50/70 border-slate-100"}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ins.color}15`, color: ins.color }}>
              {ins.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className={`text-[11.5px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{ins.title}</p>
                <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${ins.color}15`, color: ins.color }}>{ins.tag}</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{ins.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MINI RADAR / COMPARISON BARS
══════════════════════════════════════════════════════════════════ */
function ComparisonBars({ data, dark }: { data: CompetitorAnalysisData; dark: boolean }) {
  const { own, all } = data;
  const top1 = all.find(c => c.rank === 1);
  if (!top1 || top1.isOwn) return null;

  const metrics = [
    {
      label: "Rating",
      own:  own.rating,
      them: top1.rating,
      max:  5,
      fmt:  (v: number) => `${v.toFixed(1)}★`,
      color: "#f59e0b",
    },
    {
      label: "Reviews",
      own:  own.reviewCount,
      them: top1.reviewCount,
      max:  Math.max(own.reviewCount, top1.reviewCount, 1),
      fmt:  (v: number) => String(v),
      color: "#3b82f6",
    },
    {
      label: "Score",
      own:  own.compositeScore,
      them: top1.compositeScore,
      max:  100,
      fmt:  (v: number) => `${Math.round(v)}`,
      color: "#22c55e",
    },
  ];

  return (
    <div className={`rounded-2xl border overflow-hidden mb-5 ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-amber-500/15" : "bg-amber-100"}`}>
          <BarChart2 size={12} className="text-amber-400" />
        </div>
        <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.02em" }}>You vs #1 Competitor</p>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {metrics.map((m, i) => {
          const ownPct  = (m.own  / m.max) * 100;
          const themPct = (m.them / m.max) * 100;
          const winning = m.own >= m.them;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{m.label}</span>
                <div className="flex items-center gap-2">
                  {winning
                    ? <TrendingUp size={10} className="text-emerald-400" />
                    : <TrendingDown size={10} className="text-red-400" />}
                  <span className={`text-[10px] font-black ${winning ? "text-emerald-400" : "text-red-400"}`}>
                    {winning ? "+" : ""}
                    {m.label === "Rating"
                      ? (m.own - m.them).toFixed(1) + "★"
                      : m.label === "Reviews"
                      ? (m.own - m.them)
                      : Math.round(m.own - m.them)}
                  </span>
                </div>
              </div>
              {/* You bar */}
              <div className="mb-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9.5px] font-bold ${dark ? "text-blue-400" : "text-blue-600"}`}>You</span>
                  <span className={`text-[9.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>{m.fmt(m.own)}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-white/[0.05]" : "bg-slate-100"}`}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${ownPct}%`, background: "#3b82f6", boxShadow: "0 0 8px rgba(59,130,246,0.5)" }}
                  />
                </div>
              </div>
              {/* Top competitor bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9.5px] font-bold truncate max-w-[120px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    {top1.name.length > 16 ? top1.name.slice(0, 15) + "…" : top1.name}
                  </span>
                  <span className={`text-[9.5px] font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{m.fmt(m.them)}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-white/[0.05]" : "bg-slate-100"}`}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${themPct}%`, background: m.color, boxShadow: `0 0 8px ${m.color}50` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPETITOR CARD
══════════════════════════════════════════════════════════════════ */
function CompetitorCard({
  biz, dark, apiKey, ownScore,
}: { biz: Competitor; dark: boolean; apiKey: string; ownScore: number }) {
  const [open, setOpen] = useState(false);
  const color     = rankColor(biz.rank);
  const bg        = rankBg(biz.rank, dark);
  const isAboveMe = biz.compositeScore > ownScore;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${dark ? "border-white/[0.06]" : "border-slate-200/70"}`}
      style={{ background: bg }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {/* avatar / photo */}
        <div className="relative shrink-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden text-white font-black text-[16px]"
            style={{ background: `${color}25`, border: `2px solid ${color}40` }}
          >
            {biz.photoRef && apiKey
              ? <img src={getPhotoUrl(biz.photoRef, apiKey)} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
              : biz.name[0]?.toUpperCase()}
          </div>
          {/* rank badge over avatar */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border-2"
            style={{ background: color, color: "#fff", borderColor: dark ? "#070f1f" : "#fff" }}
          >
            {biz.rank}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <p className={`text-[12.5px] font-bold truncate ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.015em" }}>
                {biz.name}
              </p>
              <p className={`text-[10px] truncate mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                {biz.address || biz.primaryType.replace(/_/g, " ")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <RankBadge rank={biz.rank} />
              {isAboveMe && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                  Ahead of you
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Stars rating={biz.rating} />
              <span className={`text-[10px] font-black ml-0.5 ${dark ? "text-white" : "text-slate-900"}`}>{biz.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={9} className={dark ? "text-slate-500" : "text-slate-400"} />
              <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{biz.reviewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Navigation size={9} className={dark ? "text-slate-500" : "text-slate-400"} />
              <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{formatDist(biz.distance)}</span>
            </div>
            {biz.isOpen !== null && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${biz.isOpen ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                {biz.isOpen ? "Open" : "Closed"}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 mt-1">
          {open ? <ChevronUp size={13} className={dark ? "text-slate-600" : "text-slate-400"} /> : <ChevronDown size={13} className={dark ? "text-slate-600" : "text-slate-400"} />}
        </div>
      </div>

      {/* expanded detail */}
      {open && (
        <div className={`border-t px-4 py-3 flex flex-col gap-3 ${dark ? "border-white/[0.04]" : "border-slate-200/50"}`}>
          {/* score bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9.5px] font-black uppercase tracking-widest ${dark ? "text-slate-600" : "text-slate-400"}`}>Composite Score</span>
              <span className="text-[9.5px] font-black" style={{ color }}>{Math.round(biz.compositeScore)}/100</span>
            </div>
            <ScoreBar score={biz.compositeScore} color={color} />
          </div>

          {/* contact row */}
          <div className="grid grid-cols-2 gap-2">
            {biz.website && (
              <a
                href={biz.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${dark ? "bg-white/[0.03] border-white/[0.06] text-blue-400" : "bg-blue-50 border-blue-200/60 text-blue-600"}`}
              >
                <Globe size={10} /><span className="truncate">Website</span><ArrowUpRight size={8} />
              </a>
            )}
            {biz.phone && (
              <a
                href={`tel:${biz.phone}`}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${dark ? "bg-white/[0.03] border-white/[0.06] text-emerald-400" : "bg-emerald-50 border-emerald-200/60 text-emerald-600"}`}
              >
                <Phone size={10} /><span className="truncate">{biz.phone}</span>
              </a>
            )}
          </div>

          {/* compare to me */}
          <div className={`rounded-xl border p-2.5 ${dark ? "bg-blue-950/30 border-blue-900/30" : "bg-blue-50/60 border-blue-100"}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>vs You</p>
            <div className="flex gap-4">
              {[
                { label: "Rating",  v: (biz.rating - ownScore).toFixed(1),   icon: <Star size={9}/>,           isGood: biz.rating < ownScore },
                { label: "Reviews", v: String(biz.reviewCount - biz.reviewCount), icon: <MessageSquare size={9}/>, isGood: false },
              ].map((c, i) => {
                const ratingDiff   = parseFloat((biz.rating  - (data_ref)).toFixed(1));
                return null; // handled inline below
              })}
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <span className={`text-[16px] font-black leading-none ${biz.rating >= ownScore /* placeholder */ ? "text-red-400" : "text-emerald-400"}`}>
                  {biz.rating >= ownScore ? "+" : ""}{(biz.rating - ownScore).toFixed(1)}★
                </span>
                <span className={`text-[8.5px] ${dark ? "text-slate-600" : "text-slate-400"}`}>Rating diff</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPETITOR LIST (the real component, no data_ref hack)
══════════════════════════════════════════════════════════════════ */
function CompetitorList({ data, dark, apiKey }: { data: CompetitorAnalysisData; dark: boolean; apiKey: string }) {
  const { all, own } = data;
  const [sort, setSort] = useState<"rank" | "rating" | "reviews" | "distance">("rank");

  const sorted = useMemo(() => {
    const list = [...all];
    if (sort === "rank")     list.sort((a, b) => a.rank - b.rank);
    if (sort === "rating")   list.sort((a, b) => b.rating - a.rating);
    if (sort === "reviews")  list.sort((a, b) => b.reviewCount - a.reviewCount);
    if (sort === "distance") list.sort((a, b) => a.distance - b.distance);
    return list;
  }, [all, sort]);

  const SORTS = [
    { id: "rank" as const,     label: "Rank" },
    { id: "rating" as const,   label: "Rating" },
    { id: "reviews" as const,  label: "Reviews" },
    { id: "distance" as const, label: "Nearest" },
  ];

  return (
    <div>
      {/* sort tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {SORTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border"
            style={sort === s.id
              ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }
              : { background: dark ? "rgba(255,255,255,0.03)" : "rgba(59,130,246,0.04)", color: dark ? "#475569" : "#94a3b8", borderColor: "transparent" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map(biz => (
          biz.isOwn
            ? (
              /* OWN BUSINESS CARD */
              <div
                key={biz.placeId}
                className={`rounded-2xl border px-4 py-3.5 ${dark ? "bg-blue-500/[0.07] border-blue-700/40" : "bg-blue-50 border-blue-200/70"}`}
                style={{ boxShadow: "0 0 20px rgba(59,130,246,0.1)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-[16px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: "0 4px 16px rgba(59,130,246,0.35)" }}
                  >
                    {biz.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-[12.5px] font-black truncate ${dark ? "text-white" : "text-slate-900"}`}>{biz.name}</p>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">YOU</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Stars rating={biz.rating} />
                        <span className={`text-[10px] font-black ml-0.5 ${dark ? "text-white" : "text-slate-900"}`}>{biz.rating.toFixed(1)}</span>
                      </div>
                      <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{biz.reviewCount} reviews</span>
                    </div>
                  </div>
                  <RankBadge rank={biz.rank} large />
                </div>
              </div>
            )
            : (
              <CompetitorCardSimple key={biz.placeId} biz={biz} dark={dark} apiKey={apiKey} ownRating={own.rating} ownReviews={own.reviewCount} />
            )
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPETITOR CARD (simplified, no stale ref hack)
══════════════════════════════════════════════════════════════════ */
function CompetitorCardSimple({ biz, dark, apiKey, ownRating, ownReviews }: {
  biz: Competitor; dark: boolean; apiKey: string;
  ownRating: number; ownReviews: number;
}) {
  const [open, setOpen] = useState(false);
  const color     = rankColor(biz.rank);
  const bg        = rankBg(biz.rank, dark);
  const ratingDiff = parseFloat((biz.rating - ownRating).toFixed(1));
  const reviewDiff = biz.reviewCount - ownReviews;
  const aheadOfMe  = biz.compositeScore > 0 && biz.rank < 999;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${dark ? "border-white/[0.06]" : "border-slate-200/70"}`}
      style={{ background: bg }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        {/* avatar */}
        <div className="relative shrink-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden text-white font-black text-[16px]"
            style={{ background: `${color}25`, border: `2px solid ${color}40` }}
          >
            {biz.photoRef && apiKey
              ? <img
                  src={getPhotoUrl(biz.photoRef, apiKey)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              : biz.name[0]?.toUpperCase()
            }
          </div>
          <div
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border-2"
            style={{ background: color, color: "#fff", borderColor: dark ? "#050d1a" : "#fff" }}
          >
            {biz.rank}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <p className={`text-[12.5px] font-bold truncate ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.015em" }}>
                {biz.name}
              </p>
              <p className={`text-[10px] truncate mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                {formatDist(biz.distance)} away · {biz.address ? biz.address.split(",")[0] : biz.primaryType.replace(/_/g, " ")}
              </p>
            </div>
            <RankBadge rank={biz.rank} />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Stars rating={biz.rating} />
              <span className={`text-[10px] font-black ml-0.5 ${dark ? "text-white" : "text-slate-900"}`}>{biz.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={9} className={dark ? "text-slate-500" : "text-slate-400"} />
              <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{biz.reviewCount.toLocaleString()}</span>
            </div>
            {biz.isOpen !== null && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${biz.isOpen ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                {biz.isOpen ? "Open" : "Closed"}
              </span>
            )}
            {biz.priceLevel !== null && (
              <span className={`text-[9px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>{priceDots(biz.priceLevel)}</span>
            )}
          </div>
        </div>

        <div className="shrink-0 mt-1">
          {open
            ? <ChevronUp size={13} className={dark ? "text-slate-600" : "text-slate-400"} />
            : <ChevronDown size={13} className={dark ? "text-slate-600" : "text-slate-400"} />}
        </div>
      </div>

      {open && (
        <div className={`border-t px-4 py-3 flex flex-col gap-3 ${dark ? "border-white/[0.04]" : "border-slate-200/50"}`}>
          {/* score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9.5px] font-black uppercase tracking-widest ${dark ? "text-slate-600" : "text-slate-400"}`}>Composite Score</span>
              <span className="text-[9.5px] font-black" style={{ color }}>{Math.round(biz.compositeScore)}/100</span>
            </div>
            <ScoreBar score={biz.compositeScore} color={color} />
          </div>

          {/* vs me */}
          <div className={`rounded-xl border p-3 ${dark ? "bg-white/[0.02] border-white/[0.04]" : "bg-slate-50 border-slate-100"}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>vs You</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Rating", value: ratingDiff >= 0 ? `+${ratingDiff.toFixed(1)}★` : `${ratingDiff.toFixed(1)}★`, good: ratingDiff < 0, icon: <Star size={10}/> },
                { label: "Reviews", value: reviewDiff >= 0 ? `+${reviewDiff}` : String(reviewDiff), good: reviewDiff < 0, icon: <MessageSquare size={10}/> },
              ].map((m, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border ${dark ? "bg-white/[0.02] border-white/[0.04]" : "bg-white border-slate-100"}`}>
                  <span style={{ color: m.good ? "#4ade80" : "#f87171" }}>{m.icon}</span>
                  <div>
                    <p className={`text-[13px] font-black leading-none ${m.good ? "text-emerald-400" : "text-red-400"}`}>{m.value}</p>
                    <p className={`text-[8.5px] ${dark ? "text-slate-600" : "text-slate-400"}`}>{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* links */}
          <div className="flex gap-2">
            {biz.website && (
              <a href={biz.website} target="_blank" rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${dark ? "bg-white/[0.03] border-white/[0.06] text-blue-400" : "bg-blue-50 border-blue-200/60 text-blue-600"}`}>
                <Globe size={10} />Website
              </a>
            )}
            {biz.phone && (
              <a href={`tel:${biz.phone}`}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${dark ? "bg-white/[0.03] border-white/[0.06] text-emerald-400" : "bg-emerald-50 border-emerald-200/60 text-emerald-600"}`}>
                <Phone size={10} />Call
              </a>
            )}
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${biz.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${dark ? "bg-white/[0.03] border-white/[0.06] text-slate-400" : "bg-slate-50 border-slate-200/60 text-slate-600"}`}>
              <MapPin size={10} />Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RADIUS SELECTOR
══════════════════════════════════════════════════════════════════ */
function RadiusSelector({ value, onChange, dark }: { value: number; onChange: (v: number) => void; dark: boolean }) {
  const options = [5000, 10000, 20000, 50000];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {options.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border"
          style={value === r
            ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }
            : { background: dark ? "rgba(255,255,255,0.03)" : "rgba(59,130,246,0.04)", color: dark ? "#475569" : "#94a3b8", borderColor: "transparent" }}
        >
          {r >= 1000 ? `${r / 1000} km` : `${r} m`}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════════════ */
function PageSkeleton({ dark }: { dark: boolean }) {
  const pulse = dark ? "bg-white/[0.05]" : "bg-blue-100/60";
  return (
    <div className={`min-h-screen ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"} px-4 pt-6 pb-32 max-w-lg mx-auto`}>
      <div className={`h-6 w-44 rounded-full ${pulse} mb-2`} />
      <div className={`h-4 w-56 rounded-full ${pulse} mb-6`} />
      <div className={`h-64 rounded-3xl ${pulse} mb-4`} />
      <div className={`h-48 rounded-2xl ${pulse} mb-4`} />
      {[1, 2, 3, 4].map(i => <div key={i} className={`h-20 rounded-2xl ${pulse} mb-3`} />)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NOT CONNECTED
══════════════════════════════════════════════════════════════════ */
function NotConnected({ dark }: { dark: boolean }) {
  const router = useRouter();
  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}>
      <div className="text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <p className={`text-base font-bold mb-2 ${dark ? "text-white" : "text-slate-900"}`}>No Google Business Linked</p>
        <p className={`text-sm mb-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Connect your Google Business Profile in Settings to run competitor analysis.
        </p>
        <button
          onClick={() => router.push("/profile")}
          className="px-6 py-2.5 rounded-2xl text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}
        >
          Go to Profile
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NO PLACES KEY NOTICE
══════════════════════════════════════════════════════════════════ */
function NoPlacesKey({ dark, data }: { dark: boolean; data: CompetitorAnalysisData }) {
  return (
    <div className={`rounded-2xl border p-4 mb-5 flex items-start gap-3 ${dark ? "bg-amber-500/[0.07] border-amber-700/30" : "bg-amber-50 border-amber-200/60"}`}>
      <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className={`text-[12px] font-bold mb-0.5 ${dark ? "text-amber-300" : "text-amber-700"}`}>
          Google Maps API key not configured
        </p>
        <p className={`text-[11px] ${dark ? "text-amber-400/70" : "text-amber-600"}`}>
          Add <code className="font-mono text-[10px]">GOOGLE_MAPS_API_KEY</code> to your .env to fetch real nearby competitors.
          Showing your profile data only.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function CompetitorAnalysisPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [radius, setRadius] = useState(1500);

  const { data: user, isLoading: userLoading } = useUser();
  const locationId = user?.googleLocationId ?? "";

  function getToken(): string {
    return (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null) ?? "";
  }

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    error,
  } = useQuery<CompetitorAnalysisData>({
    queryKey: ["competitor-analysis", locationId, radius],
    queryFn: async ({ queryKey }) => {
      const [, lid, r] = queryKey as [string, string, number];
      const res = await fetch(
        `/api/google/competitor-analysis?locationId=${lid}&radius=${r}`,
        { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Competitor analysis failed");
      return json as CompetitorAnalysisData;
    },
    enabled: !!locationId,
    staleTime: 0,
    gcTime: 10 * 60_000,
    retry: 1,
  });

  // API key (public — only for photo URLs in browser)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  // Handle radius change — triggers re-fetch via queryKey
  function handleRadiusChange(r: number) {
    setRadius(r);
  }

  if (!mounted || userLoading) return <PageSkeleton dark={false} />;
  if (!locationId) return <NotConnected dark={dark} />;
  if (isLoading) return <PageSkeleton dark={dark} />;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* dot grid bg */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: dark
            ? "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)"
            : "radial-gradient(circle at 1px 1px,#2563eb 1px,transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 pb-32">

        {/* ── HEADER ── */}
        <div className="pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest ${dark ? "bg-blue-500/10 border-blue-700 text-blue-400" : "bg-blue-50 border-blue-700 text-blue-600"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-pulse" />
                  Nearby · Google Maps
                </div>
              </div>
              <h1 className={`text-lg font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.04em" }}>
                Competitor Analysis
              </h1>
              <p className={`text-[12px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-700"}`}>
                {data?.meta.locationName ?? "Your Business"} · {data?.meta.category ?? ""}
              </p>
            </div>
            <button
              onClick={() => refetch({ cancelRefetch: true })}
              disabled={isFetching}
              className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl text-white transition-all active:scale-90 shrink-0 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}
            >
              <RefreshCw size={18} style={{ animation: isFetching ? "spin 1s linear infinite" : "none" }} />
              <span className="text-[9px] font-black uppercase tracking-wide">
                {isFetching ? "Loading" : "Refresh"}
              </span>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </div>

        {/* error state */}
        {isError && (
          <div className={`rounded-2xl border p-4 mb-5 flex items-start gap-3 ${dark ? "bg-red-500/[0.07] border-red-700/30" : "bg-red-50 border-red-200/60"}`}>
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className={`text-[12px] font-bold mb-0.5 ${dark ? "text-red-300" : "text-red-700"}`}>Failed to load competitor data</p>
              <p className={`text-[11px] ${dark ? "text-red-400/70" : "text-red-600"}`}>{(error as Error)?.message}</p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* search radius selector */}
            <div className="mb-4">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                Search Radius
              </p>
              <RadiusSelector value={radius} onChange={handleRadiusChange} dark={dark} />
            </div>

            {/* no places key warning */}
            {data.competitors.length === 0 && <NoPlacesKey dark={dark} data={data} />}

            {/* rank hero */}
            <RankHero data={data} dark={dark} />

            {/* comparison bars */}
            <ComparisonBars data={data} dark={dark} />

            {/* ai insights */}
            <InsightCards data={data} dark={dark} />

            {/* nearby businesses list */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[14px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>
                  Nearby Businesses
                </p>
                <span className={`text-[11px] font-semibold ${dark ? "text-slate-500" : "text-blue-400"}`}>
                  {data.meta.totalFound} found · {(radius / 1000).toFixed(1)} km radius
                </span>
              </div>
              <CompetitorList data={data} dark={dark} apiKey={apiKey} />
            </div>

            {/* bottom cta */}
            <div
              className={`rounded-3xl border p-5 relative overflow-hidden ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-100 shadow-sm"}`}
              style={{ boxShadow: dark ? "0 20px 60px rgba(59,130,246,0.1)" : "0 8px 40px rgba(59,130,246,0.08)" }}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)" }} />
              <div className="h-px w-full mb-4" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)" }} />
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}
                  style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
                  <TrendingUp size={20} style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <p className={`text-[15px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>
                    Outrank Your Competitors
                  </p>
                  <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-400"}`}>
                    AI-powered content to push you to #1
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: <Star size={11} />, label: "Review Campaigns", color: "#f59e0b" },
                  { icon: <Zap size={11} />, label: "Weekly Posts", color: "#4ade80" },
                  { icon: <Brain size={11} />, label: "Profile Optimiser", color: "#60a5fa" },
                  { icon: <MessageSquare size={11} />, label: "Reply Templates", color: "#a78bfa" },
                ].map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
                    <span style={{ color: f.color }}>{f.icon}</span>
                    <span className={`text-[10.5px] font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{f.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/post/create")}
                className="w-full py-3.5 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6,#60a5fa)", boxShadow: "0 8px 28px rgba(59,130,246,0.38)" }}
              >
                <Sparkles size={15} /> Start AI Optimisation <ArrowUpRight size={14} className="ml-1 opacity-70" />
              </button>
              <p className={`text-center text-[10px] mt-3 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                Data from Google Places API · Refreshed on demand
              </p>
            </div>

          </>
        )}

        {/* loading overlay */}
        {isFetching && !isLoading && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-200 shadow-lg"}`}
            >
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className={`text-[11px] font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>Refreshing nearby data…</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}