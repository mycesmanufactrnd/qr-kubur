import { useState, useEffect } from "react";

export default function PaymentSuccessfulComponent() {
  const [count, setCount] = useState(5);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);
    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const circumference = 2 * Math.PI * 22;
  const progress = (count / 5) * circumference;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      <div style={{
        textAlign: "center",
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        padding: "2rem",
        maxWidth: "420px",
        width: "100%",
      }}>

        <div style={{ position: "relative", display: "inline-block", marginBottom: "2rem" }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(52,211,153,0.3)" strokeWidth="0.5" strokeDasharray="4 8" />
            <circle cx="50" cy="50" r="34" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.7)" strokeWidth="1" />
            <path
              d="M34 50 L45 61 L66 39"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="40"
              strokeDashoffset={animateIn ? 0 : 40}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s" }}
            />
          </svg>
        </div>

        <div style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.7s ease 0.4s",
        }}>
          <p style={{
            color: "rgba(16,185,129,0.9)",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            margin: "0 0 0.75rem",
            fontFamily: "'Georgia', serif",
          }}>Transaction Complete</p>
          <h1 style={{
            color: "#111827",
            fontSize: "2rem",
            fontWeight: "400",
            margin: "0 0 1rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}>Payment Successful</h1>
          <p style={{
            color: "rgba(0,0,0,0.4)",
            fontSize: "0.875rem",
            lineHeight: 1.7,
            margin: "0 0 2.5rem",
            letterSpacing: "0.02em",
          }}>
            Your transaction has been processed<br />and a receipt is on its way to you.
          </p>
        </div>

        <div style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)",
          margin: "0 0 2rem",
          opacity: animateIn ? 1 : 0,
          transition: "opacity 0.5s ease 0.7s",
        }} />

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          opacity: animateIn ? 1 : 0,
          transition: "opacity 0.5s ease 0.9s",
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width="36" height="36" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
              <circle
                cx="24" cy="24" r="22"
                fill="none"
                stroke="rgba(16,185,129,0.7)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                style={{ transition: "stroke-dashoffset 0.9s linear" }}
              />
            </svg>
            <span style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#10b981",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              fontWeight: "600",
            }}>{count}</span>
          </div>

          <p style={{
            color: "rgba(0,0,0,0.35)",
            fontSize: "0.8rem",
            letterSpacing: "0.05em",
            margin: 0,
          }}>
            {count > 0
              ? <>Redirecting in <span style={{ color: "rgba(0,0,0,0.6)" }}>{count} second{count !== 1 ? "s" : ""}</span>…</>
              : <span style={{ color: "rgba(16,185,129,0.9)" }}>Redirecting now…</span>
            }
          </p>
        </div>

      </div>
    </div>
  );
}