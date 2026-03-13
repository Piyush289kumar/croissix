// mobile_app\app\(main)\terms_and_conditions\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, ChevronDown, ExternalLink } from "lucide-react";

const LAST_UPDATED_TERMS = "March 1, 2026";

const TERMS_SECTIONS = [
  {
    title: "Acceptance of Terms",
    icon: "✅",
    content:
      "By using our app, you agree to these Terms and Conditions. Please read them carefully. If you do not agree, do not use our services.",
  },
  {
    title: "Accounts & Registration",
    icon: "👤",
    content:
      "You must provide accurate information when creating an account. You are responsible for maintaining your account credentials and all activity under your account.",
  },
  {
    title: "Use of the Service",
    icon: "📱",
    content:
      "Our app provides tools to manage your Google Business Profile and social media. You agree not to use our services for unlawful activities, spamming, or unauthorized data scraping.",
  },
  {
    title: "Google API Compliance",
    icon: "🔗",
    content:
      "We use the official Google Business Profile API. You authorize our app to access your data via Google OAuth. Your credentials are never stored by us, and all access complies with Google's API policies.",
  },
  {
    title: "Payment Terms",
    icon: "💳",
    content:
      "Subscription fees and payments are processed via Razorpay. All payments are non-refundable unless otherwise stated. You authorize us to charge your chosen payment method for subscription fees.",
  },
  {
    title: "Intellectual Property",
    icon: "©️",
    content:
      "All content, software, and materials within the app are owned by us or our licensors. You may not copy, modify, or redistribute them without permission.",
  },
  {
    title: "Termination",
    icon: "⛔",
    content:
      "We may suspend or terminate your account for violations of these Terms, inactivity, or legal reasons. You may terminate your account at any time via Account Settings.",
  },
  {
    title: "Limitation of Liability",
    icon: "⚠️",
    content:
      "Our app is provided 'as-is.' We are not liable for indirect, incidental, or consequential damages arising from your use of the service, including loss of data or business opportunities.",
  },
  {
    title: "Governing Law",
    icon: "⚖️",
    content:
      "These Terms are governed by the laws of India. Any disputes will be resolved in courts located in India, unless otherwise required by law.",
  },
  {
    title: "Changes to Terms",
    icon: "📝",
    content:
      "We may update these Terms from time to time. We'll notify you via email and in-app notice at least 7 days before material changes. Continued use after updates constitutes acceptance.",
  },
  {
    title: "Contact Information",
    icon: "📞",
    content:
      "For support, clarifications, or legal queries, please contact us at:\n\n📧 Email: support@vipprow.com\n🌐 Website: www.vipprow.com\n📞 Phone: +91 96699 32121",
  },
];
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as any },
  },
});

function Accordion({
  item,
  dark,
  index,
}: {
  item: (typeof TERMS_SECTIONS)[0];
  dark: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      {...fade(index * 0.04)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 8,
        border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
        background: dark ? "#0f1a2e" : "#fff",
        boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 15px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
        <span
          style={{
            flex: 1,
            fontSize: 13.5,
            fontWeight: 700,
            color: dark ? "#e2e8f0" : "#1e293b",
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
        >
          <ChevronDown
            size={15}
            style={{ color: dark ? "#334155" : "#94a3b8" }}
          />
        </motion.div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div
          style={{
            padding: "0 15px 14px 45px",
            borderTop: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: dark ? "#64748b" : "#64748b",
              fontWeight: 500,
              lineHeight: 1.7,
              margin: "10px 0 0",
            }}
          >
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

  const bg = dark
    ? "linear-gradient(150deg,#050d1a,#080f1e)"
    : "linear-gradient(150deg,#eef4ff,#f0f5ff)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <motion.div
          {...fade()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              color: dark ? "#94a3b8" : "#64748b",
            }}
          >
            <ArrowLeft size={15} />
          </motion.button>
          <div>
            <h1
              style={{
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: 0,
                color: dark ? "#fff" : "#0f172a",
              }}
            >
              Privacy Policy
            </h1>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                margin: "1px 0 0",
                color: dark ? "#334155" : "#94a3b8",
              }}
            >
              Updated {LAST_UPDATED_TERMS}
            </p>
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          {...fade(0.05)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 15px",
            borderRadius: 16,
            marginBottom: 18,
            background: dark ? "rgba(37,99,235,0.08)" : "rgba(219,234,254,0.5)",
            border: `1.5px solid ${dark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.45)"}`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={17} color="#fff" />
          </div>
          <div>
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: dark ? "#93c5fd" : "#1d4ed8",
                margin: 0,
              }}
            >
              Your data is yours
            </p>
            <p
              style={{
                fontSize: 11,
                color: dark ? "#475569" : "#64748b",
                fontWeight: 500,
                margin: "1px 0 0",
              }}
            >
              We never sell or share your personal information
            </p>
          </div>
        </motion.div>

        {/* Sections */}
        <div style={{ marginBottom: 20 }}>
          {TERMS_SECTIONS.map((s, i) => (
            <Accordion key={i} item={s} dark={dark} index={i} />
          ))}
        </div>

        {/* Contact */}
        <motion.div
          {...fade(0.35)}
          style={{
            borderRadius: 18,
            padding: "16px",
            marginBottom: 32,
            background: dark ? "#0f1a2e" : "#fff",
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
          }}
        >
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: dark ? "#e2e8f0" : "#1e293b",
              margin: "0 0 6px",
            }}
          >
            Questions about privacy?
          </p>
          <p
            style={{
              fontSize: 12,
              color: dark ? "#475569" : "#94a3b8",
              fontWeight: 500,
              margin: "0 0 12px",
              lineHeight: 1.6,
            }}
          >
            Contact our Data Protection Officer at any time.
          </p>
          <a
            href="mailto:privacy@vipprow.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: "#3b82f6",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={12} /> privacy@vipprow.com
          </a>
        </motion.div>
      </div>
    </div>
  );
}
