import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy mappings for backward compatibility
        border: "rgb(var(--color-border-default) / <alpha-value>)",
        input: "rgb(var(--color-border-default) / <alpha-value>)",
        ring: "rgb(var(--color-accent) / <alpha-value>)",
        background: "rgb(var(--color-bg-primary) / <alpha-value>)",
        foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
        
        // New design system colors
        primary: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
          hover: "rgb(var(--color-accent-strong) / <alpha-value>)",
          muted: "rgb(var(--color-accent-muted) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-surface-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
          strong: "rgb(var(--color-danger-strong) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--color-surface-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
          hover: "rgb(var(--color-accent-strong) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--color-surface-elevated) / <alpha-value>)",
          foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--color-surface-default) / <alpha-value>)",
          foreground: "rgb(var(--color-text-primary) / <alpha-value>)",
          hover: "rgb(var(--color-surface-hover) / <alpha-value>)",
        },
        
        // Status colors
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          strong: "rgb(var(--color-success-strong) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          strong: "rgb(var(--color-danger-strong) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          strong: "rgb(var(--color-warning-strong) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          strong: "rgb(var(--color-info-strong) / <alpha-value>)",
        },
        
        // Surface colors
        surface: {
          DEFAULT: "rgb(var(--color-surface-default) / <alpha-value>)",
          hover: "rgb(var(--color-surface-hover) / <alpha-value>)",
          active: "rgb(var(--color-surface-active) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)",
        },
        
        // Text colors
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
          disabled: "rgb(var(--color-text-disabled) / <alpha-value>)",
        },
      },
      
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-snug)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-snug)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)" }],
      },
      
      fontWeight: {
        normal: "var(--font-normal)",
        medium: "var(--font-medium)",
        semibold: "var(--font-semibold)",
        bold: "var(--font-bold)",
        black: "var(--font-black)",
      },
      
      spacing: {
        "0": "var(--space-0)",
        "px": "var(--space-px)",
        "0.5": "var(--space-0-5)",
        "1": "var(--space-1)",
        "1.5": "var(--space-1-5)",
        "2": "var(--space-2)",
        "2.5": "var(--space-2-5)",
        "3": "var(--space-3)",
        "3.5": "var(--space-3-5)",
        "4": "var(--space-4)",
        "5": "var(--space-5)",
        "6": "var(--space-6)",
        "7": "var(--space-7)",
        "8": "var(--space-8)",
        "9": "var(--space-9)",
        "10": "var(--space-10)",
        "12": "var(--space-12)",
        "14": "var(--space-14)",
        "16": "var(--space-16)",
        "20": "var(--space-20)",
      },
      
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-default)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-default)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
        none: "none",
      },
      
      transitionDuration: {
        fast: "var(--transition-fast)",
        DEFAULT: "var(--transition-default)",
        slow: "var(--transition-slow)",
        slower: "var(--transition-slower)",
      },
      
      transitionTimingFunction: {
        "in": "var(--ease-in)",
        "out": "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        "bounce": "var(--ease-bounce)",
      },
      
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        notification: "var(--z-notification)",
      },
      
      backgroundImage: {
        "gradient-profit": "var(--gradient-profit)",
        "gradient-loss": "var(--gradient-loss)",
        "gradient-accent": "var(--gradient-accent)",
        "gradient-dark": "var(--gradient-dark)",
        "gradient-surface": "var(--gradient-surface)",
      },
      
      screens: {
        "mobile": "640px",
        "tablet": "768px",
        "desktop": "1024px",
        "wide": "1280px",
        "ultra": "1536px",
      },
      
      animation: {
        "fade-in": "fadeIn var(--transition-default) var(--ease-out)",
        "slide-in": "slideIn var(--transition-default) var(--ease-out)",
        "pulse": "pulse 2s infinite",
        "shimmer": "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
}

export default config