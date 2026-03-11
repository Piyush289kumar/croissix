// mobile_app\app\(main)\help\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, ChevronDown, MessageCircle,
  Mail, ExternalLink, BookOpen, Zap, BarChart2,
  Star, Settings, CreditCard, Bell,
} from "lucide-react";

/* ── FAQ data ── */
const FAQS = [
  {
    cat: "Getting Started",
    icon: <Zap size={13} />,
    color: "#3b82f6",
    items: [
      { q: "How do I connect my Google Business Profile?", a: "Go to Dashboard → Connect → Sign in with the Google account that owns your Business Profile. We'll request only the necessary permissions via Google OAuth 2.0." },
      { q: "Can I manage multiple locations?", a: "Yes. Pro supports up to 3 locations and Agency supports unlimited. Each location is tracked independently with its own analytics, reviews, and posting schedule." },
      { q: "How long does it take to see data after connecting?", a: "Initial data sync takes 2–5 minutes. Historical analytics (up to 90 days on Pro) will populate within 10 minutes of connecting." },
    ],
  },
  {
    cat: "Analytics",
    icon: <BarChart2 size={13} />,
    color: "#8b5cf6",
    items: [
      { q: "What metrics are tracked?", a: "We track views, searches, calls, direction requests, website clicks, photo views, and review count/rating — all sourced directly from the Google Business Profile Insights API." },
      { q: "Why does my data differ from Google's dashboard?", a: "Minor discrepancies can occur due to timezone differences or data propagation delays. Our data refreshes every 6 hours. If gaps persist beyond 24 hours, contact support." },
      { q: "Can I export my analytics?", a: "Yes. Pro and Agency plans support CSV and PDF export. Go to Analytics → any chart → Export button (top right)." },
    ],
  },
  {
    cat: "Reviews",
    icon: <Star size={13} />,
    color: "#f59e0b",
    items: [
      { q: "How does AI review reply work?", a: "On Pro and Agency, our AI reads each review's sentiment, rating, and content to draft a personalised reply. You can edit before publishing. Replies are posted via the Google Business Profile API." },
      { q: "Can I reply to reviews manually?", a: "Yes. Tap any review → Reply. You can type a custom reply or use an AI draft as a starting point." },
      { q: "How quickly are new reviews shown?", a: "New reviews appear within 15 minutes of being posted on Google, subject to Google's own moderation." },
    ],
  },
  {
    cat: "Billing",
    icon: <CreditCard size={13} />,
    color: "#22c55e",
    items: [
      { q: "How does the free trial work?", a: "Every new subscription starts with a 7-day free trial. You won't be charged until the trial ends. Cancel anytime before the trial ends and pay nothing." },
      { q: "How do I cancel my subscription?", a: "Go to Settings → Subscription → Cancel Plan. Your access continues until the end of the current billing period. No refunds for partial periods." },
      { q: "What payment methods are accepted?", a: "We accept UPI, credit/debit cards, and net banking via Razorpay. All payments are secured with 256-bit SSL encryption." },
    ],
  },
  {
    cat: "Notifications",
    icon: <Bell size={13} />,
    color: "#ef4444",
    items: [
      { q: "How do I set up review alerts?", a: "Go to Settings → Notifications → Reviews. You can choose to be notified instantly, daily, or weekly for new reviews." },
      { q: "Why am I not receiving notifications?", a: "Check that push notifications are enabled for this app in your device Settings. Also verify your notification preferences haven't been turned off in Settings → Notifications." },
    ],
  },
];

const CONTACT = [
  { icon: <MessageCircle size={16} />, label: "Live Chat", sub: "Avg. reply in 5 min", action: () => {}, color: "#3b82f6", bg: "linear-gradient(135deg,#1d4ed8,#3b82f6)" },
  { icon: <Mail size={16} />, label: "Email Us", sub: "support@vipprow.com", action: () => window.open("mailto:support@vipprow.com"), color: "#8b5cf6", bg: "linear-gradient(135deg,#7c3aed,#8b5cf6)" },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as any } },
});

function FAQItem({ q, a, dark }: { q: string; a: string; dark: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}` }}>
      <motion.button whileTap={{ scale: 0.99 }} onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 0", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b", lineHeight: 1.4 }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, marginTop: 2 }}>
          <ChevronDown size={14} style={{ color: dark ? "#334155" : "#94a3b8" }} />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 12.5, color: dark ? "#64748b" : "#64748b", fontWeight: 500, lineHeight: 1.7, margin: "0 0 12px", paddingRight: 20 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const visibleFaqs = FAQS.filter(cat =>
    activeTab === "all" || cat.cat === activeTab
  ).map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !query || item.q.toLowerCase().includes(query.toLowerCase()) || item.a.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  const bg = dark ? "linear-gradient(150deg,#050d1a,#080f1e)" : "linear-gradient(150deg,#eef4ff,#f0f5ff)";
  const card = { borderRadius: 18, background: dark ? "#0f1a2e" : "#fff", border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`, boxShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,0.04)" };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <motion.div {...fade()} style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, paddingBottom: 18 }}>
          <motion.button onClick={() => router.back()} whileTap={{ scale: 0.88 }}
            style={{ width: 34, height: 34, borderRadius: 11, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: dark ? "#94a3b8" : "#64748b" }}>
            <ArrowLeft size={15} />
          </motion.button>
          <h1 style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em", margin: 0, color: dark ? "#fff" : "#0f172a" }}>Help & Support</h1>
        </motion.div>

        {/* Search */}
        <motion.div {...fade(0.05)} style={{ position: "relative", marginBottom: 14 }}>
          <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: dark ? "#334155" : "#94a3b8", pointerEvents: "none" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search help articles…"
            style={{ width: "100%", padding: "12px 13px 12px 36px", borderRadius: 14, fontSize: 13, fontWeight: 500, border: `1.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(203,213,225,0.65)"}`, background: dark ? "rgba(255,255,255,0.04)" : "#fff", color: dark ? "#e2e8f0" : "#1e293b", outline: "none", boxSizing: "border-box", fontFamily: "-apple-system,sans-serif" }}
          />
        </motion.div>

        {/* Contact cards */}
        <motion.div {...fade(0.08)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {CONTACT.map((c, i) => (
            <motion.button key={i} whileTap={{ scale: 0.96 }} onClick={c.action}
              style={{ padding: "14px 12px", borderRadius: 16, border: "none", cursor: "pointer", background: c.bg, color: "#fff", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, boxShadow: `0 6px 20px ${c.color}28`, textAlign: "left" }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 10.5, fontWeight: 500, margin: "2px 0 0", opacity: 0.8 }}>{c.sub}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Category tabs */}
        {!query && (
          <motion.div {...fade(0.1)} style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" } as React.CSSProperties}>
            {["all", ...FAQS.map(f => f.cat)].map(tab => {
              const active = activeTab === tab;
              return (
                <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab)}
                  style={{ padding: "6px 12px", borderRadius: 10, border: "1.5px solid", flexShrink: 0, borderColor: active ? "#3b82f6" : dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.55)", background: active ? (dark ? "rgba(37,99,235,0.16)" : "rgba(219,234,254,0.55)") : "transparent", color: active ? "#3b82f6" : dark ? "#475569" : "#94a3b8", fontSize: 11.5, fontWeight: 700, cursor: "pointer", transition: "all 0.16s", whiteSpace: "nowrap" as const }}>
                  {tab === "all" ? "All" : tab}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* FAQ sections */}
        <AnimatePresence mode="wait">
          {visibleFaqs.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "40px 20px" }}>
              <span style={{ fontSize: 36 }}>🔍</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: dark ? "#475569" : "#94a3b8", margin: "12px 0 4px" }}>No results found</p>
              <p style={{ fontSize: 12, color: dark ? "#334155" : "#cbd5e1", fontWeight: 500 }}>Try different keywords or contact support</p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {visibleFaqs.map((cat, ci) => (
                <motion.div key={cat.cat} {...fade(ci * 0.05)} style={{ ...card, padding: "4px 15px 4px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 0 8px", borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                    <span style={{ color: cat.color }}>{cat.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: dark ? "#94a3b8" : "#64748b", letterSpacing: "0.01em" }}>{cat.cat}</span>
                  </div>
                  {cat.items.map((item, ii) => (
                    <FAQItem key={ii} q={item.q} a={item.a} dark={dark} />
                  ))}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Docs link */}
        <motion.div {...fade(0.3)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 36, paddingTop: 4 }}>
          <BookOpen size={13} style={{ color: dark ? "#334155" : "#94a3b8" }} />
          <a href="https://docs.vipprow.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            Full documentation <ExternalLink size={10} />
          </a>
        </motion.div>

      </div>
    </div>
  );
}