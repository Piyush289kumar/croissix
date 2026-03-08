// mobile_app\app\(main)\reviews\google\page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Star, Sparkles, Send, ThumbsUp, Flag, RefreshCw,
  Filter, Search, ChevronDown, CheckCircle2, Clock,
  TrendingUp, MessageSquare, AlertCircle, Copy, Check,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  replied: boolean;
  reply?: string;
  helpful: number;
  sentiment: "positive" | "neutral" | "negative";
  flagged?: boolean;
}

type FilterType = "all" | "replied" | "unreplied" | "positive" | "negative";
type SortType   = "newest" | "oldest" | "rating_high" | "rating_low";

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const MOCK_REVIEWS: Review[] = [
  { id:"1", author:"Priya Sharma",   avatar:"PS", rating:5, date:"2 days ago",   helpful:12, replied:false, flagged:false, sentiment:"positive",
    text:"Absolutely love this place! The service was impeccable and the team went above and beyond. Will definitely be coming back. Highly recommend to everyone!" },
  { id:"2", author:"Rahul Verma",    avatar:"RV", rating:1, date:"3 days ago",   helpful:3,  replied:false, flagged:false, sentiment:"negative",
    text:"Very disappointing experience. Waited over an hour and no one acknowledged us. The staff seemed uninterested. Would not recommend." },
  { id:"3", author:"Anjali Patel",   avatar:"AP", rating:4, date:"5 days ago",   helpful:8,  replied:true,  flagged:false, sentiment:"positive",
    reply:"Thank you so much Anjali! We're thrilled you had a great experience and look forward to seeing you again soon.",
    text:"Great experience overall. The quality is top notch and the staff was friendly. Minor wait time but totally worth it." },
  { id:"4", author:"Karan Mehta",    avatar:"KM", rating:2, date:"1 week ago",   helpful:1,  replied:false, flagged:false, sentiment:"negative",
    text:"Not what I expected. The product quality has gone down significantly compared to my previous visits. Hope they improve soon." },
  { id:"5", author:"Sneha Gupta",    avatar:"SG", rating:5, date:"1 week ago",   helpful:20, replied:true,  flagged:false, sentiment:"positive",
    reply:"We're so happy to hear this, Sneha! Your kind words mean the world to our team. See you next time!",
    text:"Outstanding! From the moment I walked in I felt welcomed. The attention to detail is remarkable. 10/10 would recommend." },
  { id:"6", author:"Dev Kapoor",     avatar:"DK", rating:3, date:"2 weeks ago",  helpful:5,  replied:false, flagged:false, sentiment:"neutral",
    text:"Decent experience. Nothing extraordinary but nothing bad either. The pricing is a bit high for what you get but the quality is acceptable." },
  { id:"7", author:"Meena Iyer",     avatar:"MI", rating:5, date:"2 weeks ago",  helpful:15, replied:false, flagged:false, sentiment:"positive",
    text:"Wow, just wow. This exceeded every expectation I had. The whole team was super professional and the results speak for themselves." },
  { id:"8", author:"Arjun Singh",    avatar:"AS", rating:1, date:"3 weeks ago",  helpful:2,  replied:false, flagged:true,  sentiment:"negative",
    text:"Terrible! Complete waste of money. The staff was rude and dismissive. I asked for a manager and was told none was available. Never coming back." },
];

/* ══════════════════════════════════════════════════════════
   AI REPLY TEMPLATES
══════════════════════════════════════════════════════════ */
const AI_TEMPLATES = {
  positive: [
    (r: Review) => `Thank you so much, ${r.author.split(" ")[0]}! 🌟 We're absolutely delighted to hear you had such a wonderful experience. Your kind words genuinely motivate our entire team to keep delivering the best. We can't wait to welcome you back again soon!`,
    (r: Review) => `Wow, thank you ${r.author.split(" ")[0]}! Reviews like yours truly make our day. We work hard to provide an exceptional experience, and it's incredibly rewarding to know we succeeded. Looking forward to seeing you again!`,
  ],
  neutral: [
    (r: Review) => `Thank you for taking the time to share your feedback, ${r.author.split(" ")[0]}. We appreciate your honest review and are always looking for ways to improve. We'd love for you to give us another chance to exceed your expectations!`,
  ],
  negative: [
    (r: Review) => `Dear ${r.author.split(" ")[0]}, we sincerely apologize for the experience you described. This is not the standard we hold ourselves to, and we take your feedback very seriously. Please reach out to us directly at support@acme.com so we can make this right for you.`,
    (r: Review) => `${r.author.split(" ")[0]}, thank you for bringing this to our attention. We're truly sorry your visit didn't meet expectations. We'd like the opportunity to understand what went wrong and resolve this properly. Could you contact us directly? Your satisfaction is our priority.`,
  ],
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function getAiReply(review: Review): string {
  const pool = AI_TEMPLATES[review.sentiment];
  return pool[Math.floor(Math.random() * pool.length)](review);
}

function getRatingColor(r: number) {
  if (r >= 4) return "text-green-500";
  if (r === 3) return "text-yellow-500";
  return "text-red-500";
}

function getSentimentBadge(s: Review["sentiment"], isDark: boolean) {
  if (s === "positive") return isDark ? "bg-green-500/15 text-green-400 border-green-500/20"  : "bg-green-50 text-green-600 border-green-200";
  if (s === "negative") return isDark ? "bg-red-500/15 text-red-400 border-red-500/20"        : "bg-red-50 text-red-600 border-red-200";
  return                        isDark ? "bg-slate-500/15 text-slate-400 border-slate-500/20" : "bg-slate-50 text-slate-500 border-slate-200";
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} strokeWidth={0}
          fill={i <= rating ? "#FBBF24" : "#D1D5DB"}
          className={i <= rating ? "text-yellow-400" : "text-slate-300"}
        />
      ))}
    </div>
  );
}

function Avatar({ initials, isDark }: { initials: string; isDark: boolean }) {
  const colors = ["#3b82f6","#8b5cf6","#ec4899","#10b981","#f59e0b","#06b6d4","#ef4444","#84cc16"];
  const color  = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
      style={{ background: color }}>
      {initials}
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color, isDark }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; isDark: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-2 border
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.07em]
          ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {label}
        </span>
        <span className={`p-1.5 rounded-lg`} style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <div>
        <div className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", letterSpacing: "-0.04em" }}>
          {value}
        </div>
        {sub && <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Reply composer ────────────────────────────────────── */
function ReplyComposer({ review, isDark, onSend, onClose }: {
  review: Review; isDark: boolean;
  onSend: (text: string) => void; onClose: () => void;
}) {
  const [text,        setText]        = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [charWarning, setCharWarning] = useState(false);
  const MAX = 4096;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAI = () => {
    setGenerating(true);
    setTimeout(() => {
      setText(getAiReply(review));
      setGenerating(false);
      textareaRef.current?.focus();
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    if (text.length > MAX) { setCharWarning(true); return; }
    onSend(text.trim());
  };

  const remaining = MAX - text.length;
  const overLimit = remaining < 0;

  return (
    <div className={`mt-3 rounded-2xl p-4 border
      ${isDark ? "bg-[#0d1421] border-white/[0.08]" : "bg-slate-50 border-black/[0.06]"}`}>

      {/* AI toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={handleAI} disabled={generating}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold
            transition-all duration-150 active:scale-95 disabled:opacity-60
            ${isDark
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/20"
              : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"}`}>
          {generating
            ? <><RefreshCw size={12} className="animate-spin" /> Generating…</>
            : <><Sparkles size={12} /> AI Reply</>}
        </button>

        <div className="flex gap-1 ml-auto">
          {["Professional","Friendly","Empathetic"].map(tone => (
            <button key={tone}
              onClick={() => {
                setGenerating(true);
                setTimeout(() => { setText(getAiReply(review)); setGenerating(false); }, 900);
              }}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95
                ${isDark
                  ? "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:text-slate-700"}`}>
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); setCharWarning(false); }}
          placeholder="Write your reply… or tap AI Reply to generate one."
          rows={4}
          className={`w-full rounded-xl p-3 text-[13.5px] resize-none outline-none
            border transition-all duration-200
            ${overLimit
              ? "border-red-500/50 focus:border-red-500"
              : isDark
                ? "border-white/[0.07] focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                : "border-black/[0.07] focus:border-blue-500/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"}
            ${isDark ? "bg-[#182236] text-white placeholder:text-slate-600" : "bg-white text-slate-900 placeholder:text-slate-400"}`}
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}
        />
        {text.length > 0 && (
          <button onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-150 active:scale-90
              ${isDark ? "text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}>
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        )}
      </div>

      {/* char count + warnings */}
      <div className="flex items-center justify-between mt-2 px-0.5">
        <div className="flex items-center gap-1.5">
          {charWarning && (
            <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
              <AlertCircle size={11} /> Reply exceeds Google's 4096 character limit
            </span>
          )}
          {!charWarning && text.length > 0 && remaining < 200 && (
            <span className={`text-[11px] font-medium ${overLimit ? "text-red-400" : "text-orange-400"}`}>
              {overLimit ? `${Math.abs(remaining)} over limit` : `${remaining} left`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className={`h-8 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
              ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={!text.trim() || overLimit}
            className="h-8 px-4 rounded-xl text-[12px] font-bold text-white
              transition-all duration-150 active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 3px 12px rgba(37,99,235,0.35)" }}>
            <Send size={12} /> Post Reply
          </button>
        </div>
      </div>

      {/* Google policy note */}
      <p className={`text-[10.5px] mt-2.5 ${isDark ? "text-slate-700" : "text-slate-400"}`}>
        Replies are public on Google. Keep responses professional and avoid sharing personal info.
        Google may remove replies that violate their <span className="text-blue-500 cursor-pointer">content policies</span>.
      </p>
    </div>
  );
}

/* ── Review card ───────────────────────────────────────── */
function ReviewCard({ review, isDark, onReply, onFlag, onHelpful }: {
  review: Review; isDark: boolean;
  onReply: (id: string, text: string) => void;
  onFlag: (id: string) => void;
  onHelpful: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = review.text.length > 120;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200
      ${isDark
        ? "bg-[#131c2d] border-white/[0.06]"
        : "bg-white border-black/[0.05] shadow-sm"}
      ${review.flagged ? (isDark ? "border-red-500/20" : "border-red-200") : ""}
    `}>
      <div className="p-4">
        {/* header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar initials={review.avatar} isDark={isDark} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[14px] font-semibold truncate
                ${isDark ? "text-white" : "text-slate-900"}`}>
                {review.author}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {review.flagged && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                    <Flag size={9} /> Flagged
                  </span>
                )}
                <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5
                  ${getSentimentBadge(review.sentiment, isDark)}`}>
                  {review.sentiment}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} size={12} />
              <span className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                {review.date}
              </span>
            </div>
          </div>
        </div>

        {/* review text */}
        <p className={`text-[13.5px] leading-relaxed
          ${isDark ? "text-slate-300" : "text-slate-700"}`}
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>
          {needsTrunc && !expanded ? review.text.slice(0, 120) + "…" : review.text}
          {needsTrunc && (
            <button onClick={() => setExpanded(v => !v)}
              className="ml-1 text-blue-500 font-medium text-[12px] hover:text-blue-400 transition-colors">
              {expanded ? "Less" : "More"}
            </button>
          )}
        </p>

        {/* existing reply */}
        {review.replied && review.reply && (
          <div className={`mt-3 rounded-xl p-3 border-l-2 border-blue-500
            ${isDark ? "bg-blue-500/[0.07]" : "bg-blue-50/60"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={12} className="text-blue-500" />
              <span className={`text-[10px] font-bold uppercase tracking-wide text-blue-500`}>
                Owner Reply
              </span>
            </div>
            <p className={`text-[12.5px] leading-relaxed
              ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {review.reply}
            </p>
          </div>
        )}

        {/* action row */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t
          ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}">
          <button
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-semibold
              transition-all duration-150 active:scale-95
              ${open
                ? "bg-blue-500 text-white"
                : isDark
                  ? "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <MessageSquare size={12} />
            {review.replied ? "Edit Reply" : "Reply"}
          </button>

          <button onClick={() => onHelpful(review.id)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-medium
              transition-all duration-150 active:scale-95
              ${isDark ? "text-slate-500 hover:bg-white/[0.07] hover:text-slate-300" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}>
            <ThumbsUp size={12} /> {review.helpful}
          </button>

          <button onClick={() => onFlag(review.id)}
            className={`ml-auto flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium
              transition-all duration-150 active:scale-95
              ${review.flagged
                ? isDark ? "text-red-400 bg-red-500/10" : "text-red-500 bg-red-50"
                : isDark ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
            <Flag size={11} /> {review.flagged ? "Unflag" : "Flag"}
          </button>
        </div>
      </div>

      {/* reply composer */}
      {open && (
        <div className={`px-4 pb-4 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
          <ReplyComposer
            review={review}
            isDark={isDark}
            onSend={text => { onReply(review.id, text); setOpen(false); }}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function GoogleReviewsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted]   = useState(false);
  const [reviews, setReviews]   = useState<Review[]>(MOCK_REVIEWS);
  const [filter,  setFilter]    = useState<FilterType>("all");
  const [sort,    setSort]      = useState<SortType>("newest");
  const [search,  setSearch]    = useState("");
  const [showSort,setShowSort]  = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  /* stats */
  const avg      = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const replied  = reviews.filter(r => r.replied).length;
  const positive = reviews.filter(r => r.sentiment === "positive").length;
  const unreplied= reviews.filter(r => !r.replied).length;

  /* filter + sort + search */
  const visible = reviews
    .filter(r => {
      if (filter === "replied")   return r.replied;
      if (filter === "unreplied") return !r.replied;
      if (filter === "positive")  return r.sentiment === "positive";
      if (filter === "negative")  return r.sentiment === "negative";
      return true;
    })
    .filter(r => !search || r.author.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "rating_high") return b.rating - a.rating;
      if (sort === "rating_low")  return a.rating - b.rating;
      return 0;
    });

  const handleReply   = (id: string, text: string) =>
    setReviews(prev => prev.map(r => r.id === id ? { ...r, replied: true, reply: text } : r));
  const handleFlag    = (id: string) =>
    setReviews(prev => prev.map(r => r.id === id ? { ...r, flagged: !r.flagged } : r));
  const handleHelpful = (id: string) =>
    setReviews(prev => prev.map(r => r.id === id ? { ...r, helpful: r.helpful + 1 } : r));

  /* bulk AI reply */
  const bulkAI = () => {
    setReviews(prev => prev.map(r =>
      !r.replied ? { ...r, replied: true, reply: getAiReply(r) } : r
    ));
  };

  const ratingDist = [5,4,3,2,1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
  }));

  const SORT_LABELS: Record<SortType, string> = {
    newest: "Newest", oldest: "Oldest",
    rating_high: "Rating ↑", rating_low: "Rating ↓",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300
      ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>

      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ── page header ── */}
        <div className="pt-4 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z" fill="#4285F4"/>
              <path d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z" fill="#34A853"/>
              <path d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817-.001-.598z" fill="#FBBC05"/>
              <path d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z" fill="#EA4335"/>
            </svg>
            <h1 className={`text-[18px] font-black tracking-tight
              ${isDark ? "text-white" : "text-slate-900"}`}>
              Google Reviews
            </h1>
          </div>
          <p className={`text-[12.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Manage and respond to customer reviews
          </p>
        </div>

        {/* ── stats grid ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Avg Rating"    value={avg}      sub={`${reviews.length} reviews`}   icon={<Star size={14}/>}           color="#FBBF24" isDark={isDark}/>
          <StatCard label="Response Rate" value={`${Math.round((replied/reviews.length)*100)}%`} sub={`${replied} replied`} icon={<MessageSquare size={14}/>} color="#3b82f6" isDark={isDark}/>
          <StatCard label="Positive"      value={positive} sub="4–5 star reviews"               icon={<TrendingUp size={14}/>}     color="#22c55e" isDark={isDark}/>
          <StatCard label="Needs Reply"   value={unreplied} sub="awaiting response"             icon={<Clock size={14}/>}          color="#f97316" isDark={isDark}/>
        </div>

        {/* ── rating distribution ── */}
        <div className={`rounded-2xl p-4 mb-4 border
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-semibold uppercase tracking-[0.07em]
              ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Rating Breakdown
            </span>
            <div className="flex items-center gap-1">
              <Star size={14} fill="#FBBF24" strokeWidth={0}/>
              <span className={`text-[15px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.03em" }}>{avg}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className={`text-[11px] w-3 text-right shrink-0 font-medium
                  ${isDark ? "text-slate-500" : "text-slate-400"}`}>{star}</span>
                <Star size={10} fill="#FBBF24" strokeWidth={0} className="shrink-0"/>
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden
                  ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}>
                  <div className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                    style={{ width: `${(count / reviews.length) * 100}%` }}/>
                </div>
                <span className={`text-[11px] w-4 text-right shrink-0
                  ${isDark ? "text-slate-500" : "text-slate-400"}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── bulk AI + search + filter ── */}
        <div className="flex flex-col gap-3 mb-4">

          {/* bulk AI */}
          {unreplied > 0 && (
            <button onClick={bulkAI}
              className="w-full h-11 rounded-[13px] flex items-center justify-center gap-2
                text-[13px] font-bold text-white transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 4px 16px rgba(37,99,235,0.38)" }}>
              <Sparkles size={14} />
              Auto-Reply All Unreplied ({unreplied}) with AI
            </button>
          )}

          {/* search */}
          <div className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border
            ${isDark ? "bg-[#131c2d] border-white/[0.07]" : "bg-white border-black/[0.07]"}`}>
            <Search size={14} className={isDark ? "text-slate-600" : "text-slate-400"} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reviews…"
              className={`flex-1 bg-transparent outline-none text-[13.5px]
                ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
            />
          </div>

          {/* filter tabs + sort */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              {(["all","unreplied","replied","positive","negative"] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0
                    transition-all duration-150 active:scale-95
                    ${filter === f
                      ? "bg-blue-500 text-white"
                      : isDark
                        ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
                  {f === "all" ? "All" : f === "unreplied" ? `Unreplied (${unreplied})` : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* sort */}
            <div className="relative shrink-0">
              <button onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1 h-8 px-3 rounded-xl text-[12px] font-semibold
                  transition-all active:scale-95
                  ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}>
                <Filter size={11} /> {SORT_LABELS[sort]}
                <ChevronDown size={11} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
              </button>
              {showSort && (
                <div className={`absolute right-0 top-10 z-20 rounded-2xl border overflow-hidden shadow-xl min-w-[140px]
                  ${isDark ? "bg-[#131c2d] border-white/[0.08]" : "bg-white border-black/[0.06]"}`}>
                  {(Object.entries(SORT_LABELS) as [SortType, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => { setSort(k); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors
                        ${sort === k ? "text-blue-500 font-semibold" : isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}
                        ${isDark ? "font-medium" : ""}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── review list ── */}
        <div className="flex flex-col gap-3">
          {visible.length === 0 ? (
            <div className={`rounded-2xl p-8 text-center border
              ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}>
              <Star size={28} className="mx-auto mb-2 text-slate-400" />
              <p className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>No reviews match your filter</p>
            </div>
          ) : (
            visible.map(r => (
              <ReviewCard key={r.id} review={r} isDark={isDark}
                onReply={handleReply} onFlag={handleFlag} onHelpful={handleHelpful} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}