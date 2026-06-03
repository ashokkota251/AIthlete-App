import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: "#FFF1E8",
          100: "#FFE7DB",
          200: "#FFC9A8",
          300: "#FFA876",
          400: "#FF8A3D",
          500: "#F2541B",
          600: "#C8420F",
          700: "#9D330B",
          DEFAULT: "#F2541B",
          soft: "#FFE7DB",
          light: "#FF8A3D",
          deep: "#C8420F",
        },
        ink: {
          50: "#F5F2EE",
          100: "#ECE7E1",
          200: "#D8D0C8",
          300: "#9C948D",
          400: "#7C746D",
          500: "#5C5650",
          700: "#33302D",
          900: "#1B1620",
          DEFAULT: "#1B1620",
          /** Slightly darker than ink — used for dark CTAs in the prototype */
          deep: "#13110F",
        },
        muted: "#9C948D",
        line: "#F0E7E0",
        cream: {
          DEFAULT: "#FBF5F0",
          deep: "#F4ECE0",
          warm: "#FFFCF8",
        },
        paper: "#FFFFFF",
        strava: "#FC4C02",
        good: "#1D9E75",
        amber: "#E8913A",
        red: "#E24B4A",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        pill: "999px",
        chip: "14px",
      },
      boxShadow: {
        soft: "0 6px 18px -10px rgba(196,66,15,.22)",
        card: "0 6px 18px -10px rgba(196,66,15,.22)",
        elev: "0 14px 34px -14px rgba(196,66,15,.28)",
        glow: "0 18px 40px -16px rgba(242,84,27,.5), 0 4px 12px -4px rgba(242,84,27,.3)",
        ring: "0 0 0 4px rgba(242, 84, 27, 0.12)",
      },
      backgroundImage: {
        "coral-grad": "linear-gradient(150deg, #F2541B 0%, #FF8A3D 100%)",
        "coral-hero":
          "radial-gradient(120% 120% at 85% 0%, rgba(255,255,255,.22), transparent 55%), linear-gradient(150deg, #F2541B 0%, #FF8A3D 100%)",
        "ink-dark": "linear-gradient(150deg, #2A2230 0%, #1B1620 100%)",
        "recov-grad": "linear-gradient(150deg, #0F4C3A 0%, #15795F 100%)",
        "cream-mesh":
          "radial-gradient(70% 60% at 100% 0%, rgba(255,138,77,0.18), transparent 70%), radial-gradient(40% 30% at 0% 100%, rgba(242,84,27,0.10), transparent 70%)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drawLine: {
          "0%": { strokeDashoffset: "var(--draw-length, 600)" },
          "100%": { strokeDashoffset: "0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.85)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        rise: "rise 0.55s cubic-bezier(0.2,0.7,0.2,1) backwards",
        fadeIn: "fadeIn 0.4s ease backwards",
        slideIn: "slideIn 0.34s cubic-bezier(0.2,0.7,0.2,1) backwards",
        slideUp: "slideUp 0.38s cubic-bezier(0.2,0.7,0.2,1) backwards",
        drawLine: "drawLine 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
