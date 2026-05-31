"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AIthlete global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background:
            "radial-gradient(120% 100% at 30% 0%, #FF8A4D 0%, #F2541B 50%, #B23006 100%)",
          color: "white",
          fontFamily:
            "var(--font-body), DM Sans, system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), Space Grotesk, system-ui, sans-serif",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginBottom: 12,
            lineHeight: 1,
          }}
        >
          AIthlete<span style={{ color: "#FFC9A8" }}>.</span>
        </div>
        <p style={{ opacity: 0.85, marginBottom: 24, fontSize: 14, maxWidth: "36ch" }}>
          A critical error knocked the app over. Reload to bring it back.
        </p>
        {error?.digest && (
          <p
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
              opacity: 0.7,
              marginBottom: 16,
            }}
          >
            Ref · {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            background: "white",
            color: "#B23006",
            border: "none",
            padding: "12px 24px",
            borderRadius: 999,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
