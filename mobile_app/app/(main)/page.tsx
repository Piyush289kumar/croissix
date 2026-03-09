// mobile_app\app\(main)\page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import Image from "next/image";
import {
  Eye,
  Phone,
  Navigation,
  Globe,
  Star,
  MessageSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Bell,
  Settings,
  Zap,
  BarChart2,
  RefreshCw,
  ArrowUpRight,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Target,
  Award,
  Flame,
  Activity,
  Search,
  Plus,
  MapPin,
  Calendar,
  ShoppingBag,
  Sparkles,
  BookOpen,
  ChevronLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import CibilScore from "@/components/cards/Cibilscore";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface AnalysisSummary {
  totalImpressions: number;
  totalCalls: number;
  totalWebsite: number;
  totalDirections: number;
  totalConversations: number;
  totalReviews: number;
  avgRating: number;
  replyRate: number;
  totalPosts: number;
}

interface AnalysisData {
  success: boolean;
  summary: AnalysisSummary;
  charts: {
    impressionsByDay: { date: string; desktop: number; mobile: number }[];
  };
  recentReviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  route: string;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("accessToken")
    : null;
}

async function fetchHomeAnalysis(locationId: string): Promise<AnalysisData> {
  const res = await fetch(
    `/api/google/analysis?locationId=${locationId}&range=30d`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed");
  return json;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n ?? 0);
}

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ══════════════════════════════════════════════════════════
   MICRO SPARKLINE  (pure SVG, no recharts overhead)
══════════════════════════════════════════════════════════ */
function Sparkline({
  data,
  color,
  height = 32,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const W = 64,
    H = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min + 0.001)) * H;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `M0,${H} L${pts[0]} L${pts.join(" L")} L${W},${H} Z`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
function Sk({
  isDark,
  className = "",
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl ${isDark ? "bg-white/[0.07]" : "bg-slate-200/80"} ${className}`}
    />
  );
}

function HomeSkeleton({ isDark }: { isDark: boolean }) {
  const card = `rounded-2xl border p-4 ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100"}`;
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-32">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <Sk isDark={isDark} className="h-4 w-28 mb-2" />
          <Sk isDark={isDark} className="h-3 w-20" />
        </div>
        <Sk isDark={isDark} className="w-10 h-10 rounded-2xl" />
      </div>
      {/* hero card */}
      <Sk isDark={isDark} className="h-40 rounded-3xl" />
      {/* metrics row */}
      <div className="flex gap-3 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <Sk
            key={i}
            isDark={isDark}
            className="h-24 w-32 shrink-0 rounded-2xl"
          />
        ))}
      </div>
      {/* section */}
      <Sk isDark={isDark} className="h-3 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Sk key={i} isDark={isDark} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Sk isDark={isDark} className="h-36 rounded-2xl" />
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   GOOGLE LOGO
══════════════════════════════════════════════════════════ */
function GoogleLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z"
        fill="#34A853"
      />
      <path
        d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════ */
function SectionHeader({
  title,
  subtitle,
  action,
  isDark,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  isDark: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2
          className={`text-[14px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          style={{
            fontFamily: "-apple-system,'SF Pro Display',sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={`flex items-center gap-1 text-[12px] font-semibold transition-colors
            ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"}`}
        >
          {action.label} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HERO PERFORMANCE CARD
   Wide card with gradient, big number, mini sparkline
══════════════════════════════════════════════════════════ */
function HeroCard({
  summary,
  sparkData,
  isDark,
  onTap,
}: {
  summary: AnalysisSummary;
  sparkData: number[];
  isDark: boolean;
  onTap: () => void;
}) {
  const totalLeads =
    summary.totalCalls + summary.totalDirections + summary.totalConversations;

  return (
    <div
      onClick={onTap}
      className="relative rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-150"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0f1f3d 0%, #1a2d4a 50%, #0d1421 100%)"
          : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1e40af 100%)",
        boxShadow: isDark
          ? "0 20px 60px rgba(37,99,235,0.2), 0 0 0 1px rgba(255,255,255,0.06)"
          : "0 20px 60px rgba(37,99,235,0.35)",
      }}
    >
      {/* grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 28px)",
        }}
      />

      {/* glow orb */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #60a5fa, transparent 70%)",
        }}
      />

      <div className="relative p-5">
        {/* top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
              <GoogleLogo size={18} />
            </div>
            <div>
              <p className="text-white text-[10px] font-semibold uppercase tracking-widest">
                Google Performance
              </p>
              <p className="text-white/80 text-[10px]">Last 30 days</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-green-400/20 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-green-300 text-[10px] font-bold">Live</span>
          </div>
        </div>

        {/* big metric */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span
                className="text-[38px] font-black text-white leading-none"
                style={{
                  fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                  letterSpacing: "-0.05em",
                }}
              >
                {fmt(summary.totalImpressions)}
              </span>
              <span className="text-white/50 text-[13px] font-medium mb-1">
                views
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[12px] text-white/70 font-medium">
                <span className="text-green-300 font-bold">
                  {fmt(totalLeads)}
                </span>{" "}
                leads
              </span>
              <span className="text-[12px] text-white/70 font-medium">
                <span className="text-yellow-300 font-bold">
                  {summary.avgRating}★
                </span>{" "}
                rating
              </span>
              <span className="text-[12px] text-white/70 font-medium">
                <span className="text-blue-300 font-bold">
                  {summary.totalReviews}
                </span>{" "}
                reviews
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Sparkline data={sparkData} color="#93c5fd" height={36} />
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <ArrowUpRight size={10} className="text-green-400" />
              <span className="text-green-400 font-semibold">View details</span>
            </div>
          </div>
        </div>
      </div>

      {/* bottom strip metrics */}
      <div className="grid grid-cols-4 border-t border-white/[0.08]">
        {[
          {
            label: "Calls",
            value: fmt(summary.totalCalls),
            icon: <Phone size={11} />,
          },
          {
            label: "Website",
            value: fmt(summary.totalWebsite),
            icon: <Globe size={11} />,
          },
          {
            label: "Directions",
            value: fmt(summary.totalDirections),
            icon: <Navigation size={11} />,
          },
          {
            label: "Posts",
            value: String(summary.totalPosts),
            icon: <FileText size={11} />,
          },
        ].map((m, i) => (
          <div
            key={i}
            className={`flex flex-col items-center py-3 gap-0.5
            ${i < 3 ? "border-r border-white/[0.08]" : ""}`}
          >
            <span className="text-white/40">{m.icon}</span>
            <span className="text-white text-sm font-black leading-none py-1">
              {m.value}
            </span>
            <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wide">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HORIZONTAL METRICS SCROLL STRIP
   (swipeable cards: Views · Calls · Website · Directions · Reviews · Reply Rate)
══════════════════════════════════════════════════════════ */
interface MetricCardData {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  sparkData?: number[];
}

function MetricScrollStrip({
  metrics,
  isDark,
}: {
  metrics: MetricCardData[];
  isDark: boolean;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`shrink-0 rounded-2xl border p-3.5 flex flex-col gap-2 min-w-[130px]
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
          style={{ boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <span
              className="p-1.5 rounded-xl"
              style={{ background: `${m.color}18` }}
            >
              <span style={{ color: m.color }}>{m.icon}</span>
            </span>
            {m.sparkData && m.sparkData.length > 1 && (
              <Sparkline data={m.sparkData} color={m.color} height={22} />
            )}
          </div>
          <div>
            <p
              className={`text-[22px] font-black leading-none mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
              style={{
                fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                letterSpacing: "-0.04em",
              }}
            >
              {m.value}
            </p>
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              {m.label}
            </p>
            <p
              className={`text-[10px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-500"}`}
            >
              {m.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPETITOR ANALYSIS CARD (horizontal scroll)
══════════════════════════════════════════════════════════ */
interface Competitor {
  name: string;
  rating: number;
  reviews: number;
  position: number;
  status: "ahead" | "behind" | "tied";
}

function CompetitorCard({
  comp,
  myRating,
  isDark,
}: {
  comp: Competitor;
  myRating: number;
  isDark: boolean;
}) {
  const diff = parseFloat((comp.rating - myRating).toFixed(1));
  const isAhead = diff < 0;
  const isTied = diff === 0;

  return (
    <div
      className={`shrink-0 rounded-2xl border p-4 min-w-[180px] flex flex-col gap-3
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      {/* position badge */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-black px-2 py-0.5 rounded-full
          ${
            comp.position === 1
              ? "bg-yellow-500/20 text-yellow-400"
              : isDark
                ? "bg-white/[0.07] text-slate-500"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          #{comp.position} Ranked
        </span>
        <span
          className={`text-[10px] font-bold flex items-center gap-0.5
          ${isAhead ? "text-green-400" : isTied ? (isDark ? "text-slate-500" : "text-slate-500") : "text-red-400"}`}
        >
          {isAhead ? (
            <TrendingDown size={10} />
          ) : isTied ? (
            <Minus size={10} />
          ) : (
            <TrendingUp size={10} />
          )}
          {isTied ? "Tied" : `${Math.abs(diff)}★`}
        </span>
      </div>

      {/* name + avatar */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white shrink-0"
          style={{
            background: `hsl(${(comp.name.charCodeAt(0) * 37) % 360}, 60%, 45%)`,
          }}
        >
          {comp.name[0]}
        </div>
        <div className="min-w-0">
          <p
            className={`text-[12.5px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {comp.name}
          </p>
          <p
            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            {comp.reviews.toLocaleString()} reviews
          </p>
        </div>
      </div>

      {/* rating bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Rating
          </span>
          <span
            className={`text-[12px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {comp.rating}★
          </span>
        </div>
        <div
          className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(comp.rating / 5) * 100}%`,
              background: isAhead ? "#22c55e" : isTied ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
══════════════════════════════════════════════════════════ */
function QuickActionsGrid({
  isDark,
  onNavigate,
}: {
  isDark: boolean;
  onNavigate: (r: string) => void;
}) {
  const actions = [
    {
      label: "New Post",
      icon: <Plus size={18} />,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.12)",
      route: "/post/create",
    },
    {
      label: "Reviews",
      icon: <MessageSquare size={18} />,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
      route: "/reviews/google",
    },
    {
      label: "Analytics",
      icon: <BarChart2 size={18} />,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
      route: "/analysis/google",
    },
    {
      label: "My Posts",
      icon: <FileText size={18} />,
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
      route: "/post",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onNavigate(a.route)}
          className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl border transition-all active:scale-90
            ${isDark ? "bg-[#131c2d] border-white/[0.06] hover:bg-[#182236]" : "bg-white border-slate-100 shadow-sm hover:bg-slate-50"}`}
        >
          <span
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: a.bg }}
          >
            <span style={{ color: a.color }}>{a.icon}</span>
          </span>
          <span
            className={`text-[10px] font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW HEALTH CARD
══════════════════════════════════════════════════════════ */
function ReviewHealthCard({
  summary,
  isDark,
  onNavigate,
}: {
  summary: AnalysisSummary;
  isDark: boolean;
  onNavigate: () => void;
}) {
  const score = Math.round(
    (summary.avgRating / 5) * 40 +
      (summary.replyRate / 100) * 30 +
      Math.min(summary.totalReviews / 100, 1) * 30,
  );

  const scoreColor =
    score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel =
    score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Needs Work";

  return (
    <div
      onClick={onNavigate}
      className={`rounded-2xl border p-4 cursor-pointer active:scale-[0.98] transition-transform
        ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className={`text-[13px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          Review Health
        </p>
        <ChevronRight
          size={14}
          className={isDark ? "text-slate-500" : "text-slate-500"}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 163} 163`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-[16px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
              style={{
                fontFamily: "-apple-system,'SF Pro Display',sans-serif",
              }}
            >
              {score}
            </span>
            <span
              className="text-[8px] font-semibold"
              style={{ color: scoreColor }}
            >
              {scoreLabel}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          {[
            {
              label: "Avg Rating",
              value: `${summary.avgRating}/5.0`,
              pct: (summary.avgRating / 5) * 100,
              color: "#f59e0b",
            },
            {
              label: "Reply Rate",
              value: `${summary.replyRate}%`,
              pct: summary.replyRate,
              color: "#06b6d4",
            },
            {
              label: "Reviews",
              value: String(summary.totalReviews),
              pct: Math.min(summary.totalReviews, 100),
              color: "#8b5cf6",
            },
          ].map((row, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}
                >
                  {row.label}
                </span>
                <span
                  className={`text-[10px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {row.value}
                </span>
              </div>
              <div
                className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${row.pct}%`, background: row.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RECENT ACTIVITY FEED
══════════════════════════════════════════════════════════ */
function ActivityFeed({
  reviews,
  isDark,
}: {
  reviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
  isDark: boolean;
}) {
  if (!reviews?.length) return null;
  const ratingColors = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
  ];

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-2">
          <Star
            size={13}
            className="text-yellow-400"
            style={{ fill: "#facc15" }}
          />
          <p
            className={`text-[13px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.02em" }}
          >
            Recent Reviews
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full
          ${isDark ? "bg-white/[0.07] text-slate-500" : "bg-slate-100 text-slate-500"}`}
        >
          {reviews.length}
        </span>
      </div>
      <div className="flex flex-col">
        {reviews.slice(0, 3).map((r, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-3 ${i < 2 ? `border-b ${isDark ? "border-white/[0.04]" : "border-slate-50"}` : ""}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
              style={{
                background: `hsl(${(r.author.charCodeAt(0) * 73) % 360}, 55%, 45%)`,
              }}
            >
              {r.author[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p
                  className={`text-[12px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {r.author}
                </p>
                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={9}
                      style={{
                        fill:
                          j < r.rating
                            ? ratingColors[r.rating]
                            : isDark
                              ? "#1e2a42"
                              : "#e2e8f0",
                        color:
                          j < r.rating
                            ? ratingColors[r.rating]
                            : isDark
                              ? "#1e2a42"
                              : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
              </div>
              <p
                className={`text-[11.5px] leading-relaxed mt-0.5 line-clamp-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
              >
                {r.comment || "No comment"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[9.5px] ${isDark ? "text-slate-600" : "text-slate-500"}`}
                >
                  {new Date(r.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                {r.replied && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"}`}
                  >
                    Replied
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INSIGHT TIPS CARD  (smart suggestions)
══════════════════════════════════════════════════════════ */
function InsightTip({
  summary,
  isDark,
  onAction,
}: {
  summary: AnalysisSummary;
  isDark: boolean;
  onAction: (route: string) => void;
}) {
  const tips = [
    ...(summary.replyRate < 50
      ? [
          {
            id: "reply",
            icon: <MessageSquare size={14} />,
            color: "#06b6d4",
            title: "Low Reply Rate",
            desc: `Only ${summary.replyRate}% of reviews replied. Boost trust by responding.`,
            cta: "Reply Now",
            route: "/reviews/google",
          },
        ]
      : []),
    ...(summary.totalPosts === 0
      ? [
          {
            id: "post",
            icon: <FileText size={14} />,
            color: "#8b5cf6",
            title: "No Posts This Month",
            desc: "Businesses that post regularly get 4× more views.",
            cta: "Create Post",
            route: "/post/create",
          },
        ]
      : []),
    ...(summary.avgRating < 4
      ? [
          {
            id: "rating",
            icon: <Star size={14} />,
            color: "#f59e0b",
            title: `Rating Below 4★`,
            desc: `Your ${summary.avgRating}★ avg can be improved. Focus on happy customers.`,
            cta: "View Reviews",
            route: "/reviews/google",
          },
        ]
      : []),
    {
      id: "analytics",
      icon: <BarChart2 size={14} />,
      color: "#3b82f6",
      title: "Deep Analytics Available",
      desc: `${fmt(summary.totalImpressions)} impressions last 30 days. See full breakdown.`,
      cta: "View Analytics",
      route: "/analysis/google",
    },
  ];

  const tip = tips[0];
  if (!tip) return null;

  return (
    <div
      className={`rounded-2xl border p-4 flex items-start gap-3
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <span
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${tip.color}18`, color: tip.color }}
      >
        {tip.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[12.5px] font-bold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {tip.title}
        </p>
        <p
          className={`text-[11.5px] leading-relaxed ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          {tip.desc}
        </p>
        <button
          onClick={() => onAction(tip.route)}
          className={`mt-2 flex items-center gap-1 text-[11px] font-bold transition-colors`}
          style={{ color: tip.color }}
        >
          {tip.cta} <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   MOCK COMPETITORS  (real implementation would use Places API)
══════════════════════════════════════════════════════════ */
function generateCompetitors(myRating: number): Competitor[] {
  return [
    {
      name: "DigiEdge Pro",
      rating: parseFloat((myRating + 0.3).toFixed(1)),
      reviews: 312,
      position: 1,
      status: "behind",
    },
    {
      name: "LocalBoost Co",
      rating: parseFloat((myRating + 0.1).toFixed(1)),
      reviews: 198,
      position: 2,
      status: "behind",
    },
    {
      name: "YourBusiness",
      rating: myRating,
      reviews: 0,
      position: 3,
      status: "tied",
    },
    {
      name: "CityMarket Hub",
      rating: parseFloat((myRating - 0.2).toFixed(1)),
      reviews: 145,
      position: 4,
      status: "ahead",
    },
    {
      name: "NearShop Plus",
      rating: parseFloat((myRating - 0.4).toFixed(1)),
      reviews: 89,
      position: 5,
      status: "ahead",
    },
  ].map((c) => ({
    ...c,
    rating: Math.min(5, Math.max(1, c.rating)),
  }));
}

/* ══════════════════════════════════════════════════════════
   NOT CONNECTED PROMPT
══════════════════════════════════════════════════════════ */
function NotConnectedBanner({
  isDark,
  onGo,
}: {
  isDark: boolean;
  onGo: () => void;
}) {
  return (
    <div
      onClick={onGo}
      className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform
        ${isDark ? "bg-yellow-500/[0.07] border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
        ${isDark ? "bg-yellow-500/15" : "bg-yellow-100"}`}
      >
        <AlertCircle size={18} className="text-yellow-500" />
      </div>
      <div className="flex-1">
        <p
          className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Connect Google Business
        </p>
        <p
          className={`text-[11.5px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Tap to link your profile and unlock analytics
        </p>
      </div>
      <ChevronRight
        size={15}
        className={isDark ? "text-slate-500" : "text-slate-500"}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN HOME PAGE
══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const { data: user, isLoading: userLoading } = useUser();

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError,
    refetch,
  } = useQuery<AnalysisData>({
    queryKey: ["home-analytics", user?.googleLocationId],
    queryFn: () => fetchHomeAnalysis(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const isLoading = userLoading || (analyticsLoading && !analytics);

  /* sparkline — total impressions per day (desktop+mobile) */
  const sparkData =
    analytics?.charts?.impressionsByDay?.map((d) => d.desktop + d.mobile) ?? [];

  /* metric strip data */
  const s = analytics?.summary;
  const metrics: MetricCardData[] = s
    ? [
        {
          label: "Views",
          value: fmt(s.totalImpressions),
          sub: "Impressions",
          icon: <Eye size={14} />,
          color: "#3b82f6",
          sparkData: sparkData.slice(-14),
        },
        {
          label: "Calls",
          value: fmt(s.totalCalls),
          sub: "Call clicks",
          icon: <Phone size={14} />,
          color: "#22c55e",
        },
        {
          label: "Website",
          value: fmt(s.totalWebsite),
          sub: "Link clicks",
          icon: <Globe size={14} />,
          color: "#8b5cf6",
        },
        {
          label: "Directions",
          value: fmt(s.totalDirections),
          sub: "Map requests",
          icon: <Navigation size={14} />,
          color: "#f97316",
        },
        {
          label: "Leads",
          value: fmt(s.totalCalls + s.totalDirections + s.totalConversations),
          sub: "Total leads",
          icon: <Target size={14} />,
          color: "#06b6d4",
        },
        {
          label: "Reviews",
          value: String(s.totalReviews),
          sub: `${s.avgRating}★ avg`,
          icon: <Star size={14} />,
          color: "#f59e0b",
        },
      ]
    : [];

  const competitors = s ? generateCompetitors(s.avgRating) : [];

  const bg = isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bg}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div className="max-w-lg mx-auto px-4 pb-32">
        {/* ════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════ */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            {userLoading ? (
              <>
                <Sk isDark={isDark} className="h-4 w-32 mb-1.5" />
                <Sk isDark={isDark} className="h-3 w-24" />
              </>
            ) : (
              <>
                <p
                  className={`text-[13px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}
                >
                  {greet()} 👋
                </p>
                <h1
                  className={`text-[20px] font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{
                    fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {user?.name?.split(" ")[0] ?? "Welcome"}
                </h1>
                {user?.googleLocationName && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Building2
                      size={24}
                      className={isDark ? "text-slate-600" : "text-slate-500"}
                    />
                    <span
                      className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      {user.googleLocationName}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* refresh */}
            {analytics && (
              <button
                onClick={() => refetch()}
                className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all active:scale-90
                  ${isDark ? "bg-white/[0.07] text-slate-500 hover:bg-white/[0.12]" : "bg-white text-slate-500 border border-slate-200"}`}
              >
                <RefreshCw
                  size={14}
                  className={analyticsLoading ? "animate-spin" : ""}
                />
              </button>
            )}
            {/* avatar */}
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-black text-white
                transition-all active:scale-90 overflow-hidden shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              }}
            >
              {user?.name ? getInitials(user.name) : <Settings size={16} />}
            </button>
          </div>
        </div>

        <div className="pt-4 pb-4 flex items-center justify-center">
          <CibilScore score={300} change={12} min={0} max={1000} />
        </div>

        {/* ════════════════════════════════════════════
            SKELETON
        ════════════════════════════════════════════ */}
        {isLoading && <HomeSkeleton isDark={isDark} />}

        {/* ════════════════════════════════════════════
            MAIN CONTENT
        ════════════════════════════════════════════ */}
        {!isLoading && (
          <div className="flex flex-col gap-6">
            {/* ── not connected ── */}
            {!user?.googleLocationId && (
              <NotConnectedBanner
                isDark={isDark}
                onGo={() => router.push("/profile")}
              />
            )}

            {/* ── error state ── */}
            {isError && user?.googleLocationId && (
              <div
                className={`rounded-2xl border p-4 flex items-center gap-3
                ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
              >
                <WifiOff size={16} className="text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-red-400">
                    Failed to load analytics
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="text-[11px] font-semibold text-blue-500 mt-0.5"
                  >
                    Tap to retry
                  </button>
                </div>
              </div>
            )}

            {/* ── HERO PERFORMANCE CARD ── */}
            {s && (
              <HeroCard
                summary={s}
                sparkData={sparkData}
                isDark={isDark}
                onTap={() => router.push("/analysis/google")}
              />
            )}

            {/* ── QUICK ACTIONS ── */}
            <div>
              <SectionHeader title="Quick Actions" isDark={isDark} />
              <QuickActionsGrid
                isDark={isDark}
                onNavigate={(r) => router.push(r)}
              />
            </div>

            {/* ── METRICS SCROLL STRIP ── */}
            {metrics.length > 0 && (
              <div>
                <SectionHeader
                  title="Google Performance"
                  subtitle="Last 30 days"
                  isDark={isDark}
                  action={{
                    label: "Full report",
                    onClick: () => router.push("/analysis/google"),
                  }}
                />
                <MetricScrollStrip metrics={metrics} isDark={isDark} />
              </div>
            )}

            {/* ── REVIEW HEALTH ── */}
            {s && (
              <div>
                <SectionHeader title="Review Health" isDark={isDark} />
                <ReviewHealthCard
                  summary={s}
                  isDark={isDark}
                  onNavigate={() => router.push("/reviews/google")}
                />
              </div>
            )}

            {/* ── COMPETITOR ANALYSIS ── */}
            {s && competitors.length > 0 && (
              <div>
                <SectionHeader
                  title="Competitor Analysis"
                  subtitle="Nearby businesses · Google Maps"
                  isDark={isDark}
                  action={{
                    label: "See all",
                    onClick: () => router.push("/analysis/google"),
                  }}
                />

                {/* your position summary */}
                <div
                  className={`rounded-2xl border px-4 py-3 mb-3 flex items-center gap-3
                  ${isDark ? "bg-blue-500/[0.08] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center
                    ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}
                  >
                    <Award
                      size={16}
                      className={isDark ? "text-blue-400" : "text-blue-600"}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-[12.5px] font-bold ${isDark ? "text-blue-300" : "text-blue-800"}`}
                    >
                      You rank #3 in your area
                    </p>
                    <p
                      className={`text-[11px] ${isDark ? "text-blue-400/70" : "text-blue-600/70"}`}
                    >
                      0.3★ behind the top competitor
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`text-[20px] font-black ${isDark ? "text-blue-400" : "text-blue-700"}`}
                      style={{
                        fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      #{3}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {competitors.map((c, i) => (
                    <CompetitorCard
                      key={i}
                      comp={c}
                      myRating={s.avgRating}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── INSIGHT / SMART TIP ── */}
            {s && (
              <div>
                <SectionHeader
                  title="Smart Insights"
                  subtitle="AI-powered recommendations"
                  isDark={isDark}
                />
                <InsightTip
                  summary={s}
                  isDark={isDark}
                  onAction={(r) => router.push(r)}
                />
              </div>
            )}

            {/* ── RECENT REVIEWS ── */}
            {analytics?.recentReviews && analytics.recentReviews.length > 0 && (
              <div>
                <SectionHeader
                  title="Recent Reviews"
                  isDark={isDark}
                  action={{
                    label: "All reviews",
                    onClick: () => router.push("/reviews/google"),
                  }}
                />
                <ActivityFeed
                  reviews={analytics.recentReviews}
                  isDark={isDark}
                />
              </div>
            )}

            {/* ── STATS FOOTER STRIP ── */}
            {s && (
              <div
                className={`rounded-2xl border grid grid-cols-3 overflow-hidden
                ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
              >
                {[
                  {
                    label: "Conversations",
                    value: fmt(s.totalConversations),
                    color: "#06b6d4",
                  },
                  {
                    label: "Posts Live",
                    value: String(s.totalPosts),
                    color: "#8b5cf6",
                  },
                  {
                    label: "Reply Rate",
                    value: `${s.replyRate}%`,
                    color: "#22c55e",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center py-4 gap-1
                    ${i < 2 ? `border-r ${isDark ? "border-white/[0.06]" : "border-slate-100"}` : ""}`}
                  >
                    <span
                      className={`text-[20px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                      style={{
                        fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                        color: row.color,
                      }}
                    >
                      {row.value}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* no google connected — empty quick actions still show */}
            {!user?.googleLocationId && (
              <QuickActionsGrid
                isDark={isDark}
                onNavigate={(r) => router.push(r)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
