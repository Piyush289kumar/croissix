// mobile_app\components\buttons\ImproveScoreButton.ts

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Brain, Sparkles, ArrowUpRight, Zap } from "lucide-react";

export default function ImproveScoreButton() {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tick, setTick] = useState(0);

  // shimmer ticker
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 100), 50);
    return () => clearInterval(id);
  }, []);

  function handleClick() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      router.push("/dashboard/checklist");
    }, 900);
  }

  const particles = [
    { x: "15%", y: "20%", delay: "0s", size: 3 },
    { x: "80%", y: "30%", delay: "0.4s", size: 2 },
    { x: "25%", y: "75%", delay: "0.8s", size: 2.5 },
    { x: "70%", y: "65%", delay: "0.2s", size: 2 },
    { x: "50%", y: "15%", delay: "0.6s", size: 1.5 },
    { x: "90%", y: "70%", delay: "1s", size: 2 },
  ];

  return (
    <button
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: "100%",
        height: 54,
        borderRadius: 18,
        border: "1px solid rgba(99,179,237,0.35)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        color: "white",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "-0.025em",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 0.15s cubic-bezier(0.4,0,0.2,1), box-shadow 0.15s",
        boxShadow: pressed
          ? "0 2px 12px rgba(6,182,212,0.25)"
          : "0 8px 32px rgba(6,182,212,0.35), 0 0 0 1px rgba(99,179,237,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
        background:
          "linear-gradient(135deg, #0c2340 0%, #0f3460 40%, #0891b2 100%)",
      }}
    >
      {/* ── animated gradient overlay ── */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(105deg, transparent ${tick}%, rgba(6,182,212,0.18) ${tick + 15}%, transparent ${tick + 30}%)`,
          transition: "none",
        }}
      />

      {/* ── grid texture ── */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.06,
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 20px)",
        }}
      />

      {/* ── bottom glow line ── */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, transparent, rgba(6,182,212,0.7), transparent)",
        }}
      />

      {/* ── floating particles ── */}
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            pointerEvents: "none",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(6,182,212,0.7)",
            animation: `pulse 2s ease-in-out ${p.delay} infinite`,
            boxShadow: "0 0 4px rgba(6,182,212,0.9)",
          }}
        />
      ))}

      {/* ── scanning state ── */}
      {scanning ? (
        <>
          <span
            style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "60%",
              height: "100%",
              pointerEvents: "none",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              animation: "sweep 0.9s ease-in-out forwards",
            }}
          />
          <Brain
            size={16}
            style={{
              color: "#67e8f9",
              flexShrink: 0,
              animation: "spin 0.5s linear infinite",
            }}
          />
          <span style={{ color: "#67e8f9" }}>Launching Audit…</span>
        </>
      ) : (
        <>
          {/* left icon cluster */}
          <span
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Brain size={16} style={{ color: "#67e8f9" }} />
            <Sparkles
              size={8}
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                color: "#fbbf24",
                animation: "pulse 1.6s ease-in-out infinite",
              }}
            />
          </span>

          {/* label */}
          <span style={{ color: "white" }}>Improve Google Score</span>

          {/* score pill */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 7px",
              borderRadius: 999,
              background: "rgba(6,182,212,0.2)",
              border: "1px solid rgba(6,182,212,0.3)",
              fontSize: 10,
              fontWeight: 800,
              color: "#67e8f9",
              letterSpacing: "0.02em",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <Zap size={8} style={{ color: "#fbbf24" }} /> AI
          </span>

          <ArrowUpRight
            size={14}
            style={{ color: "rgba(103,232,249,0.7)", flexShrink: 0 }}
          />
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes sweep {
          0% { left: -60%; }
          100% { left: 150%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
