import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        "background-2": "var(--bg-2)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        // Brand "ember" stops
        brand: {
          1: "var(--brand-1)",
          2: "var(--brand-2)",
          3: "var(--brand-3)",
          DEFAULT: "var(--brand-2)",
        },
        // Neon accents
        neon: {
          violet: "var(--neon-violet)",
          cyan: "var(--neon-cyan)",
          mint: "var(--neon-mint)",
          rose: "var(--neon-rose)",
          amber: "var(--neon-amber)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(110deg, var(--brand-1), var(--brand-2) 50%, var(--brand-3))",
        "cool-gradient":
          "linear-gradient(110deg, var(--neon-cyan), var(--neon-violet))",
        "glass-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))",
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(168, 85, 247, 0.5)",
        "glow-ember": "0 0 40px -10px rgba(255, 61, 129, 0.55)",
        "glow-mint": "0 0 32px -10px rgba(62, 230, 176, 0.55)",
        "glow-rose": "0 0 32px -10px rgba(255, 93, 126, 0.55)",
        "glow-cyan": "0 0 32px -10px rgba(56, 225, 255, 0.5)",
        glass: "0 8px 32px -12px rgba(0,0,0,0.6)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        riseIn: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        rise: "riseIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeIn 0.25s ease-out both",
        floaty: "floaty 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
