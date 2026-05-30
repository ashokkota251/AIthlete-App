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
          50: "#FFF1E9",
          100: "#FFE0CE",
          200: "#FFC9A8",
          300: "#FFA876",
          400: "#FF8A4D",
          500: "#F2541B",
          600: "#D8400B",
          700: "#B23006",
          DEFAULT: "#F2541B",
        },
        ink: {
          50: "#F5F6F8",
          100: "#ECEDF1",
          200: "#D2D4DC",
          300: "#A6A8B4",
          400: "#7C7F8E",
          500: "#545765",
          700: "#2A2D3C",
          900: "#0E0F18",
          DEFAULT: "#0E0F18",
        },
        cream: {
          DEFAULT: "#FBF6EE",
          deep: "#F4ECE0",
          warm: "#FFFCF8",
        },
        paper: "#FFFFFF",
        strava: "#FC4C02",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontVariationSettings: {
        compressed: '"opsz" 96, "wdth" 85',
      },
      borderRadius: {
        card: "24px",
        pill: "999px",
        chip: "14px",
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(20, 16, 8, 0.12), 0 2px 6px -2px rgba(20, 16, 8, 0.04)",
        soft: "0 4px 12px -4px rgba(20, 16, 8, 0.08)",
        elev: "0 24px 60px -24px rgba(242, 84, 27, 0.4), 0 8px 24px -10px rgba(242, 84, 27, 0.2)",
        ring: "0 0 0 4px rgba(242, 84, 27, 0.12)",
        glow: "0 12px 30px -10px rgba(242, 84, 27, 0.45)",
      },
      backgroundImage: {
        "coral-grad":
          "linear-gradient(135deg, #FF8A4D 0%, #F2541B 55%, #D8400B 100%)",
        "coral-soft":
          "linear-gradient(180deg, rgba(255,138,77,0.18) 0%, rgba(242,84,27,0.04) 100%)",
        "cream-mesh":
          "radial-gradient(70% 60% at 100% 0%, rgba(255,138,77,0.18), transparent 70%), radial-gradient(40% 30% at 0% 100%, rgba(242,84,27,0.10), transparent 70%)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
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
        drawLine: "drawLine 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
