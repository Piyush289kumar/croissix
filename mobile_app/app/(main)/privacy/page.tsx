// mobile_app\app\(main)\privacy\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, ChevronDown, ExternalLink } from "lucide-react";

const LAST_UPDATED = "March 1, 2026";

const SECTIONS = [
  {
    title: "Information We Collect",
    icon: "📋",
    content: "We collect information you provide directly — such as your name, email, business details, and payment information when you create an account or subscribe. We also automatically collect usage data, device information, and analytics about how you interact with our platform.",
  },
  {
    title: "How We Use Your Data",
    icon: "⚙️",
    content: "Your data is used to provide and improve our services, process payments, send important account updates, and generate insights for your Google Business Profile. We do not sell your personal information to third parties.",
  },
  {
    title: "Google API Usage",
    icon: "🔗",
    content: "Our app accesses your Google Business Profile data through the official Google Business Profile API. We only request the permissions necessary to display and update your business information. Your Google credentials are never stored by us — authentication is handled securely via Google OAuth 2.0.",
  },
  {
    title: "Data Storage & Security",
    icon: "🔒",
    content: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use industry-standard security practices including regular audits, access controls, and intrusion detection. Payment data is handled by Razorpay and never touches our servers.",
  },
  {
    title: "Cookies & Tracking",
    icon: "🍪",
    content: "We use essential cookies for authentication and session management, and analytics cookies (anonymised) to understand how our product is used. You can disable non-essential cookies in your device or browser settings.",
  },
  {
    title: "Third-Party Services",
    icon: "🤝",
    content: "We use Razorpay for payments, Google APIs for business profile data, and anonymised analytics tools. Each third party has their own privacy policy. We only share the minimum data required for these services to function.",
  },
  {
    title: "Your Rights",
    icon: "✋",
    content: "You have the right to access, correct, or delete your personal data at any time. You can export your data from Account Settings or contact us at privacy@vipprow.com. Under GDPR and Indian IT Act, we will respond to all requests within 30 days.",
  },
  {
    title: "Data Retention",
    icon: "🗂️",
    content: "We retain your data for as long as your account is active. Upon deletion, your personal data is purged within 30 days. Anonymised analytics data may be retained for up to 2 years.",
  },
  {
    title: "Changes to This Policy",
    icon: "📝",
    content: "We may update this policy from time to time. We'll notify you by email and in-app notification at least 7 days before any material changes take effect. Continued use after the effective date constitutes acceptance.",
  },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as any } },
});

function Accordion({ item, dark, index }: { item: typeof SECTIONS[0]; dark: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...fade(index * 0.04)}
      style={{ borderRadius: 16, overflow: "hidden", marginBottom: 8, border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`, background: dark ? "#0f1a2e" : "#fff", boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.03)" }}>
      <motion.button whileTap={{ scale: 0.99 }} onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b", letterSpacing: "-0.01em" }}>{item.title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown size={15} style={{ color: dark ? "#334155" : "#94a3b8" }} />
        </motion.div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}>
        <div style={{ padding: "0 15px 14px 45px", borderTop: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}` }}>
          <p style={{ fontSize: 13, color: dark ? "#64748b" : "#64748b", fontWeight: 500, lineHeight: 1.7, margin: "10px 0 0" }}>
            {item.content}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PrivacyPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const bg = dark ? "linear-gradient(150deg,#050d1a,#080f1e)" : "linear-gradient(150deg,#eef4ff,#f0f5ff)";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <motion.div {...fade()} style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, paddingBottom: 20 }}>
          <motion.button onClick={() => router.back()} whileTap={{ scale: 0.88 }}
            style={{ width: 34, height: 34, borderRadius: 11, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: dark ? "#94a3b8" : "#64748b" }}>
            <ArrowLeft size={15} />
          </motion.button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em", margin: 0, color: dark ? "#fff" : "#0f172a" }}>Privacy Policy</h1>
            <p style={{ fontSize: 10.5, fontWeight: 500, margin: "1px 0 0", color: dark ? "#334155" : "#94a3b8" }}>Updated {LAST_UPDATED}</p>
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.div {...fade(0.05)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 16, marginBottom: 18, background: dark ? "rgba(37,99,235,0.08)" : "rgba(219,234,254,0.5)", border: `1.5px solid ${dark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.45)"}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={17} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 800, color: dark ? "#93c5fd" : "#1d4ed8", margin: 0 }}>Your data is yours</p>
            <p style={{ fontSize: 11, color: dark ? "#475569" : "#64748b", fontWeight: 500, margin: "1px 0 0" }}>We never sell or share your personal information</p>
          </div>
        </motion.div>

        {/* Sections */}
        <div style={{ marginBottom: 20 }}>
          {SECTIONS.map((s, i) => (
            <Accordion key={i} item={s} dark={dark} index={i} />
          ))}
        </div>

        {/* Contact */}
        <motion.div {...fade(0.35)} style={{ borderRadius: 18, padding: "16px", marginBottom: 32, background: dark ? "#0f1a2e" : "#fff", border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}` }}>
          <p style={{ fontSize: 12.5, fontWeight: 800, color: dark ? "#e2e8f0" : "#1e293b", margin: "0 0 6px" }}>Questions about privacy?</p>
          <p style={{ fontSize: 12, color: dark ? "#475569" : "#94a3b8", fontWeight: 500, margin: "0 0 12px", lineHeight: 1.6 }}>
            Contact our Data Protection Officer at any time.
          </p>
          <a href="mailto:privacy@vipprow.com"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#3b82f6", textDecoration: "none" }}>
            <ExternalLink size={12} /> privacy@vipprow.com
          </a>
        </motion.div>

      </div>
    </div>
  );
}