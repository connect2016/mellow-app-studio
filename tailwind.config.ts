import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        ticket: {
          cream: "hsl(var(--ticket-cream))",
        },
        ivy: {
          DEFAULT: "hsl(var(--ivy-green))",
        },
        brick: {
          DEFAULT: "hsl(var(--brick-red))",
        },
        "day-blue": {
          DEFAULT: "hsl(var(--day-blue))",
        },
        lineup: {
          DEFAULT: "hsl(var(--lineup-teal))",
          foreground: "hsl(var(--lineup-teal-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
          sunken: "hsl(var(--surface-sunken))",
        },
        // Cubs brand palette (raw hex per design-token spec).
        // NOTE: Project standard is HSL CSS variables; these literals do not
        // participate in dark-mode theming. Prefer existing semantic tokens
        // (ivy, brick, day-blue, ticket.cream) for new components.
        brand: {
          blue: "#0E3386",
          red: "#CC3433",
          cream: "#F5F0E8",
          "blue-light": "#1A4FA8",
          "blue-dark": "#0A2460",
        },
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      backgroundImage: {
        "gradient-ivy": "var(--gradient-ivy)",
        "gradient-brick": "var(--gradient-brick)",
        "gradient-cream": "var(--gradient-cream)",
        "gradient-sky": "var(--gradient-sky)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        pennant: "var(--shadow-pennant)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Additive design-token rounding (do not override existing sm).
        card: "12px",
        pill: "9999px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fab-breath": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        "fab-enter": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fab-tap": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.94)" },
          "70%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
        "vibe-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fab-breath": "fab-breath 1.6s ease-in-out infinite",
        "fab-enter": "fab-enter 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        "fab-tap": "fab-tap 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "vibe-in": "vibe-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      fontFamily: {
        scoreboard: ["'Share Tech Mono'", "'Courier New'", "monospace"],
        heading: ["'Bebas Neue'", "'Inter'", "sans-serif"],
        display: ["'Bebas Neue'", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
