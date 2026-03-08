// mobile_app\app\(main)\reviews\google\page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/features/user/hook/useUser";
import {
  Star,
  Sparkles,
  Send,
  ThumbsUp,
  Flag,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  WifiOff,
  Loader2,
  Building2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES — matching Google My Business API v4 response
══════════════════════════════════════════════════════════ */
interface GoogleReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

interface Review {
  name: string; // raw GMB name — used as API key for reply
  id: string;
  author: string;
  initials: string;
  rating: number;
  date: string;
  text: string;
  replied: boolean;
  reply?: string;
  helpful: number;
  sentiment: "positive" | "neutral" | "negative";
  flagged: boolean;
}

type FilterType = "all" | "replied" | "unreplied" | "positive" | "negative";
type SortType = "newest" | "oldest" | "rating_high" | "rating_low";

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const STAR: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

function toSentiment(r: number): Review["sentiment"] {
  return r >= 4 ? "positive" : r === 3 ? "neutral" : "negative";
}

function mkInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalise(g: GoogleReview): Review {
  const rating = STAR[g.starRating] ?? 3;
  return {
    name: g.name,
    id: g.reviewId,
    author: g.reviewer.displayName,
    initials: mkInitials(g.reviewer.displayName),
    rating,
    date: new Date(g.createTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    text: g.comment ?? "",
    replied: !!g.reviewReply,
    reply: g.reviewReply?.comment,
    helpful: 0,
    sentiment: toSentiment(rating),
    flagged: false,
  };
}

/* ══════════════════════════════════════════════════════════
   AI TEMPLATES
══════════════════════════════════════════════════════════ */
const TEMPLATES: Record<Review["sentiment"], ((r: Review) => string)[]> = {
  positive: [
    (r) =>
      `Thank you so much, ${r.author.split(" ")[0]}! 🌟 We're absolutely delighted to hear you had such a wonderful experience. Your kind words genuinely motivate our entire team. We can't wait to welcome you back!`,
    (r) =>
      `Wow, thank you ${r.author.split(" ")[0]}! Reviews like yours truly make our day. We work hard to provide an exceptional experience and it's incredibly rewarding to know we succeeded!`,
  ],
  neutral: [
    (r) =>
      `Thank you for your honest feedback, ${r.author.split(" ")[0]}. We appreciate you taking the time to share your experience and are always looking for ways to improve. We'd love for you to give us another chance!`,
  ],
  negative: [
    (r) =>
      `Dear ${r.author.split(" ")[0]}, we sincerely apologize for the experience you described. This is not the standard we hold ourselves to, and we take your feedback very seriously. Please reach out to us directly so we can make this right.`,
    (r) =>
      `${r.author.split(" ")[0]}, thank you for bringing this to our attention. We're truly sorry your visit didn't meet expectations. We'd like the opportunity to resolve this — could you contact us directly?`,
  ],
};

function getAiReply(review: Review, tone?: string): string {
  const pool = TEMPLATES[review.sentiment];
  let text = pool[Math.floor(Math.random() * pool.length)](review);
  if (tone === "Friendly") text = text + " 😊";
  if (tone === "Empathetic")
    text = "We completely understand how you feel. " + text;
  return text;
}

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          fill={i <= rating ? "#FBBF24" : "#374151"}
        />
      ))}
    </div>
  );
}

function Av({ initials: ini }: { initials: string }) {
  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#10b981",
    "#f59e0b",
    "#06b6d4",
    "#ef4444",
    "#84cc16",
  ];
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
      style={{ background: COLORS[ini.charCodeAt(0) % COLORS.length] }}
    >
      {ini}
    </div>
  );
}

function Spin({
  size = 16,
  white = false,
}: {
  size?: number;
  white?: boolean;
}) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={white ? "white" : "currentColor"}
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={white ? "white" : "currentColor"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function sentimentCls(s: Review["sentiment"], isDark: boolean) {
  if (s === "positive")
    return isDark
      ? "bg-green-500/15 text-green-400 border-green-500/20"
      : "bg-green-50 text-green-700 border-green-200";
  if (s === "negative")
    return isDark
      ? "bg-red-500/15 text-red-400 border-red-500/20"
      : "bg-red-50 text-red-600 border-red-200";
  return isDark
    ? "bg-slate-500/15 text-slate-400 border-slate-500/20"
    : "bg-slate-50 text-slate-500 border-slate-200";
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
   STAT CARD
══════════════════════════════════════════════════════════ */
function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  isDark,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-2 border
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.07em] ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {label}
        </span>
        <span className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <div>
        <div
          className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          style={{
            fontFamily: "-apple-system,'SF Pro Display',sans-serif",
            letterSpacing: "-0.04em",
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPLY COMPOSER
══════════════════════════════════════════════════════════ */
function ReplyComposer({
  review,
  isDark,
  onSend,
  onClose,
}: {
  review: Review;
  isDark: boolean;
  onSend: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState(review.reply ?? "");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState("");
  const MAX = 4096;
  const taRef = useRef<HTMLTextAreaElement>(null);

  const generateAI = (tone?: string) => {
    setGenerating(true);
    setTimeout(() => {
      setText(getAiReply(review, tone));
      setGenerating(false);
      taRef.current?.focus();
    }, 1000);
  };

  const handleSend = async () => {
    setApiError("");
    if (!text.trim() || text.length > MAX) return;
    setPosting(true);
    try {
      await onSend(text.trim());
    } catch (e: any) {
      setApiError(e.message ?? "Failed to post reply.");
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX - text.length;
  const overLimit = remaining < 0;

  return (
    <div
      className={`mt-3 rounded-2xl p-4 border
      ${isDark ? "bg-[#0d1421] border-white/[0.08]" : "bg-slate-50 border-black/[0.06]"}`}
    >
      {/* AI toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => generateAI()}
          disabled={generating}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold
            transition-all active:scale-95 disabled:opacity-60
            ${
              isDark
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/22"
                : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            }`}
        >
          {generating ? (
            <>
              <RefreshCw size={12} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={12} /> AI Reply
            </>
          )}
        </button>
        {["Professional", "Friendly", "Empathetic"].map((tone) => (
          <button
            key={tone}
            onClick={() => generateAI(tone)}
            disabled={generating}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 disabled:opacity-50
              ${
                isDark
                  ? "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
          >
            {tone}
          </button>
        ))}
      </div>

      {/* textarea */}
      <div className="relative">
        <textarea
          ref={taRef}
          value={text}
          rows={4}
          onChange={(e) => {
            setText(e.target.value);
            setApiError("");
          }}
          placeholder="Write your reply… or tap AI Reply to generate one."
          className={`w-full rounded-xl p-3 text-[13.5px] resize-none outline-none border transition-all duration-200
            ${
              overLimit
                ? "border-red-500/50"
                : isDark
                  ? "border-white/[0.07] focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                  : "border-black/[0.07] focus:border-blue-500/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
            }
            ${isDark ? "bg-[#182236] text-white placeholder:text-slate-600" : "bg-white text-slate-900 placeholder:text-slate-400"}`}
          style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
        />
        {text.length > 0 && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all active:scale-90
              ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
          >
            {copied ? (
              <Check size={13} className="text-green-500" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between mt-2 px-0.5">
        <div>
          {apiError && (
            <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
              <AlertCircle size={11} /> {apiError}
            </span>
          )}
          {!apiError && overLimit && (
            <span className="text-[11px] text-red-400 font-medium">
              {Math.abs(remaining)} over limit
            </span>
          )}
          {!apiError && !overLimit && remaining < 200 && text.length > 0 && (
            <span className="text-[11px] text-orange-400 font-medium">
              {remaining} chars left
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`h-8 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
              ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || overLimit || posting}
            className="h-8 px-4 rounded-xl text-[12px] font-bold text-white
              flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 3px 12px rgba(37,99,235,0.35)",
            }}
          >
            {posting ? (
              <Spin size={13} white />
            ) : (
              <>
                <Send size={12} />
                Post Reply
              </>
            )}
          </button>
        </div>
      </div>

      <p
        className={`text-[10.5px] mt-2.5 ${isDark ? "text-slate-700" : "text-slate-400"}`}
      >
        Replies are public on Google. Keep responses professional and avoid
        sharing personal information.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW CARD
══════════════════════════════════════════════════════════ */
function ReviewCard({
  review,
  isDark,
  onReply,
  onFlag,
  onHelpful,
}: {
  review: Review;
  isDark: boolean;
  onReply: (reviewName: string, text: string) => Promise<void>;
  onFlag: (id: string) => void;
  onHelpful: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = (review.text?.length ?? 0) > 120;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}
      ${review.flagged ? (isDark ? "border-red-500/25" : "border-red-200") : ""}`}
    >
      <div className="p-4">
        {/* header */}
        <div className="flex items-start gap-3 mb-3">
          <Av initials={review.initials} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[14px] font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {review.author}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {review.flagged && (
                  <span
                    className={`text-[10px] font-semibold border rounded-full px-2 py-0.5
                    ${isDark ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-red-50 text-red-500 border-red-200"}`}
                  >
                    Flagged
                  </span>
                )}
                <span
                  className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${sentimentCls(review.sentiment, isDark)}`}
                >
                  {review.sentiment}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} />
              <span
                className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                {review.date}
              </span>
            </div>
          </div>
        </div>

        {/* text */}
        {review.text ? (
          <p
            className={`text-[13.5px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}
            style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
          >
            {needsTrunc && !expanded
              ? review.text.slice(0, 120) + "…"
              : review.text}
            {needsTrunc && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-1 text-blue-500 text-[12px] font-medium hover:text-blue-400 transition-colors"
              >
                {expanded ? "Less" : "More"}
              </button>
            )}
          </p>
        ) : (
          <p
            className={`text-[12.5px] italic ${isDark ? "text-slate-600" : "text-slate-400"}`}
          >
            No written comment
          </p>
        )}

        {/* existing reply */}
        {review.replied && review.reply && (
          <div
            className={`mt-3 rounded-xl p-3 border-l-2 border-blue-500
            ${isDark ? "bg-blue-500/[0.07]" : "bg-blue-50/60"}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                Owner Reply
              </span>
            </div>
            <p
              className={`text-[12.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {review.reply}
            </p>
          </div>
        )}

        {/* actions */}
        <div
          className={`flex items-center gap-1 mt-3 pt-3 border-t
          ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
        >
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-semibold
              transition-all active:scale-95
              ${
                open
                  ? "bg-blue-500 text-white"
                  : isDark
                    ? "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <MessageSquare size={12} />
            {review.replied ? "Edit Reply" : "Reply"}
          </button>

          <button
            onClick={() => onHelpful(review.id)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-medium
              transition-all active:scale-95
              ${isDark ? "text-slate-500 hover:bg-white/[0.07] hover:text-slate-300" : "text-slate-400 hover:bg-slate-100"}`}
          >
            <ThumbsUp size={12} /> {review.helpful}
          </button>

          <button
            onClick={() => onFlag(review.id)}
            className={`ml-auto flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium
              transition-all active:scale-95
              ${
                review.flagged
                  ? isDark
                    ? "text-red-400 bg-red-500/10"
                    : "text-red-500 bg-red-50"
                  : isDark
                    ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                    : "text-slate-400 hover:text-red-500 hover:bg-red-50"
              }`}
          >
            <Flag size={11} /> {review.flagged ? "Unflag" : "Flag"}
          </button>
        </div>
      </div>

      {/* composer */}
      {open && (
        <div
          className={`px-4 pb-4 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
        >
          <ReplyComposer
            review={review}
            isDark={isDark}
            onSend={async (text) => {
              await onReply(review.name, text);
              setOpen(false);
            }}
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const { data: user, isLoading: userLoading } = useUser();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);

  /* ── fetch from your API route ── */
  const fetchReviews = useCallback(async () => {
    if (!user?.googleLocationId) return;
    setFetching(true);
    setFetchErr("");
    try {
      const res = await fetch(
        `/api/google/reviews?location=accounts/me/locations/${user.googleLocationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error ?? "Failed to load reviews");
      setReviews((json.reviews as GoogleReview[]).map(normalise));
    } catch (e: any) {
      setFetchErr(e.message ?? "Something went wrong");
    } finally {
      setFetching(false);
    }
  }, [user?.googleLocationId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* ── post reply to /api/google/reply ── */
  const postReply = async (reviewName: string, comment: string) => {
    const res = await fetch("/api/google/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewName, comment }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Reply failed");
    // optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.name === reviewName ? { ...r, replied: true, reply: comment } : r,
      ),
    );
  };

  /* ── bulk AI reply ── */
  const bulkAI = async () => {
    for (const r of reviews.filter((x) => !x.replied)) {
      try {
        await postReply(r.name, getAiReply(r));
      } catch {
        /* skip failed, continue */
      }
    }
  };

  const handleFlag = (id: string) =>
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, flagged: !r.flagged } : r)),
    );
  const handleHelpful = (id: string) =>
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r)),
    );

  /* ── stats ── */
  const total = reviews.length;
  const avg = total
    ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : "—";
  const replied = reviews.filter((r) => r.replied).length;
  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const unreplied = reviews.filter((r) => !r.replied).length;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  /* ── filtered / sorted ── */
  const visible = reviews
    .filter((r) => {
      if (filter === "replied") return r.replied;
      if (filter === "unreplied") return !r.replied;
      if (filter === "positive") return r.sentiment === "positive";
      if (filter === "negative") return r.sentiment === "negative";
      return true;
    })
    .filter(
      (r) =>
        !search ||
        r.author.toLowerCase().includes(search.toLowerCase()) ||
        r.text.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "rating_high") return b.rating - a.rating;
      if (sort === "rating_low") return a.rating - b.rating;
      return 0;
    });

  const SORT_LABELS: Record<SortType, string> = {
    newest: "Newest",
    oldest: "Oldest",
    rating_high: "Rating ↑",
    rating_low: "Rating ↓",
  };

  const isLoading = userLoading || (fetching && reviews.length === 0);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div
      className={`min-h-screen transition-colors duration-300
      ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div className="max-w-lg mx-auto px-4 pb-28">
        {/* ── header ── */}
        <div className="pt-4 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <GoogleLogo />
                <h1
                  className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{
                    fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Google Reviews
                </h1>
              </div>
              {user?.googleLocationName && (
                <div className="flex items-center gap-1.5">
                  <Building2
                    size={11}
                    className={isDark ? "text-slate-600" : "text-slate-400"}
                  />
                  <span
                    className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {user.googleLocationName}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={fetchReviews}
              disabled={fetching}
              className={`w-9 h-9 flex items-center justify-center rounded-xl
                transition-all active:scale-90 disabled:opacity-50
                ${isDark ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              <RefreshCw size={15} className={fetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2
              size={28}
              className={`animate-spin ${isDark ? "text-blue-400" : "text-blue-500"}`}
            />
            <p
              className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {userLoading
                ? "Loading profile…"
                : "Fetching reviews from Google…"}
            </p>
          </div>
        )}

        {/* ── not linked ── */}
        {!userLoading && !user?.googleLocationId && (
          <div
            className={`rounded-2xl p-8 text-center border
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
          >
            <Building2
              size={32}
              className={`mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}
            />
            <p
              className={`text-[14px] font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              No Google Business Linked
            </p>
            <p
              className={`text-[12.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Go to your Profile page and link your Google Business Profile to
              start managing reviews.
            </p>
          </div>
        )}

        {/* ── fetch error ── */}
        {fetchErr && (
          <div
            className={`rounded-2xl p-4 flex items-start gap-3 border mb-4
            ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
          >
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-red-400 mb-0.5">
                Failed to load reviews
              </p>
              <p
                className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}
              >
                {fetchErr}
              </p>
              <button
                onClick={fetchReviews}
                className="mt-2 text-[12px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── main content ── */}
        {!isLoading && reviews.length > 0 && (
          <>
            {/* stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard
                label="Avg Rating"
                value={avg}
                sub={`${total} reviews`}
                icon={<Star size={14} />}
                color="#FBBF24"
                isDark={isDark}
              />
              <StatCard
                label="Response Rate"
                value={`${Math.round((replied / total) * 100)}%`}
                sub={`${replied} replied`}
                icon={<MessageSquare size={14} />}
                color="#3b82f6"
                isDark={isDark}
              />
              <StatCard
                label="Positive"
                value={positive}
                sub="4–5 star reviews"
                icon={<TrendingUp size={14} />}
                color="#22c55e"
                isDark={isDark}
              />
              <StatCard
                label="Needs Reply"
                value={unreplied}
                sub="awaiting response"
                icon={<Clock size={14} />}
                color="#f97316"
                isDark={isDark}
              />
            </div>

            {/* rating breakdown */}
            <div
              className={`rounded-2xl p-4 mb-4 border
              ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.07em] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Rating Breakdown
                </span>
                <div className="flex items-center gap-1">
                  <Star size={13} fill="#FBBF24" strokeWidth={0} />
                  <span
                    className={`text-[15px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    {avg}
                  </span>
                </div>
              </div>
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[11px] w-3 text-right shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {star}
                  </span>
                  <Star
                    size={9}
                    fill="#FBBF24"
                    strokeWidth={0}
                    className="shrink-0"
                  />
                  <div
                    className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{
                        width: total ? `${(count / total) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span
                    className={`text-[11px] w-4 text-right shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* bulk AI */}
            {unreplied > 0 && (
              <button
                onClick={bulkAI}
                className="w-full h-11 rounded-[13px] flex items-center justify-center gap-2
                  text-[13px] font-bold text-white mb-4 transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.38)",
                }}
              >
                <Sparkles size={14} />
                Auto-Reply All Unreplied ({unreplied}) with AI
              </button>
            )}

            {/* search */}
            <div
              className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border mb-3
              ${isDark ? "bg-[#131c2d] border-white/[0.07]" : "bg-white border-black/[0.07]"}`}
            >
              <Search
                size={14}
                className={isDark ? "text-slate-600" : "text-slate-400"}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reviews…"
                className={`flex-1 bg-transparent outline-none text-[13.5px]
                  ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>

            {/* filter + sort */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar">
                {(
                  [
                    "all",
                    "unreplied",
                    "replied",
                    "positive",
                    "negative",
                  ] as FilterType[]
                ).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0
                      transition-all active:scale-95
                      ${
                        filter === f
                          ? "bg-blue-500 text-white"
                          : isDark
                            ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                            : "bg-white text-slate-500 border border-slate-200"
                      }`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "unreplied"
                        ? `Unreplied (${unreplied})`
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSort((v) => !v)}
                  className={`flex items-center gap-1 h-8 px-3 rounded-xl text-[12px] font-semibold
                    transition-all active:scale-95
                    ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}
                >
                  <Filter size={11} /> {SORT_LABELS[sort]}
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${showSort ? "rotate-180" : ""}`}
                  />
                </button>
                {showSort && (
                  <div
                    className={`absolute right-0 top-10 z-20 rounded-2xl border overflow-hidden shadow-xl min-w-[140px]
                    ${isDark ? "bg-[#131c2d] border-white/[0.08]" : "bg-white border-black/[0.06]"}`}
                  >
                    {(Object.entries(SORT_LABELS) as [SortType, string][]).map(
                      ([k, v]) => (
                        <button
                          key={k}
                          onClick={() => {
                            setSort(k);
                            setShowSort(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors
                          ${sort === k ? "text-blue-500 font-semibold" : isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {v}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* review list */}
            <div className="flex flex-col gap-3">
              {visible.length === 0 ? (
                <div
                  className={`rounded-2xl p-8 text-center border
                  ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
                >
                  <Star size={26} className="mx-auto mb-2 text-slate-400" />
                  <p
                    className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    No reviews match your filter
                  </p>
                </div>
              ) : (
                visible.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    isDark={isDark}
                    onReply={postReply}
                    onFlag={handleFlag}
                    onHelpful={handleHelpful}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
