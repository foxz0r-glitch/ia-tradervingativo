import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
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
      },
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "soft-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 24px hsl(160 84% 39% / 0.35)",
          },
          "50%": {
            transform: "scale(1.04)",
            boxShadow: "0 0 32px hsl(160 84% 39% / 0.6)",
          },
        },
        "aurora-slow": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(60px, 40px) scale(1.1)" },
        },
        "aurora-slow-rev": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-50px, -30px) scale(1.08)" },
        },
        "aurora-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "translate(-50%, 0) scale(1)" },
          "50%": { opacity: "1", transform: "translate(-50%, 0) scale(1.15)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-40vh)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(40vh)", opacity: "0" },
        },
        "radar-spin": {
          "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        "drift-a": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "50%": { transform: "translate(-40px, 50px)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "50%": { transform: "translate(50px, -40px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        float: "float 3s ease-in-out infinite",
        "soft-pulse": "soft-pulse 2s ease-in-out infinite",
        "aurora-slow": "aurora-slow 18s ease-in-out infinite",
        "aurora-slow-rev": "aurora-slow-rev 22s ease-in-out infinite",
        "aurora-pulse": "aurora-pulse 10s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
        "radar-spin": "radar-spin 24s linear infinite",
        "drift-a": "drift-a 20s ease-in-out infinite",
        "drift-b": "drift-b 26s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
