import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          accent: "var(--color-brand-accent)",
          "accent-hover": "var(--color-brand-accent-hover)",
          "accent-soft": "var(--color-brand-accent-soft)",
          "accent-muted": "var(--color-brand-accent-muted)",
        },
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
          elevated: "var(--color-surface-elevated)",
        },
        sidebar: {
          bg: "var(--color-sidebar-bg)",
          text: "var(--color-sidebar-text)",
          active: "var(--color-sidebar-active)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        border: {
          default: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
        },
        status: {
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          error: "var(--color-error)",
          info: "var(--color-info)",
          active: "var(--color-status-active)",
          inactive: "var(--color-status-inactive)",
          pending: "var(--color-status-pending)",
          critical: "var(--color-status-critical)",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.8125rem",
        base: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)",
        lg: "0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)",
        xl: "0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)",
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
