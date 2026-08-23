const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
        // DESIGN.md brand tokens
        //
        // `primary` is the signature coral and is UNCHANGED. It measures 3.28:1
        // on white and 2.89:1 on `surface-soft` — fine for the large display
        // type, fills, borders and dots it was designed for, but below the 4.5:1
        // WCAG 2.2 AA floor for normal-size text. Rather than darken the brand
        // colour everywhere (which would flatten the coral callout cards, badges
        // and CTA bands the design system is built around), the two text-facing
        // roles get their own tokens:
        primary: "#cc785c",
        // Coral as *text* on any cream/white surface — links, prices, eyebrow
        // labels. Same hue (15°) and saturation (52%) as `primary`, lightness
        // dropped 58%→42%, so it still reads as the brand coral. Clears 4.5:1
        // against every light surface in use: white 5.46, canvas 5.18,
        // surface-soft 4.81, surface-card 4.52.
        "primary-text": "#a65134",
        // Coral as a *fill under white text* — the primary CTA background. Only
        // needs to be dark enough that white text on it reaches 4.5:1 (4.53),
        // which is a far smaller shift than `primary-text` and keeps buttons
        // visually close to the original coral.
        "primary-strong": "#bb5a3a",
        "primary-hover": "#a9583e",
        // Was referenced as `hover:bg-primary-active` in country-popup but never
        // defined here, so that class silently compiled to nothing and the
        // button had no hover state at all. DESIGN.md names this role
        // `primary-active`; keeping both names pointing at the same hex fixes
        // the dead class without renaming existing `primary-hover` call sites.
        "primary-active": "#a9583e",
        "primary-disabled": "#e6dfd8",
        // Surfaces
        canvas: "#faf9f5",
        "surface-soft": "#f5f0e8",
        "surface-card": "#efe9de",
        "surface-cream-strong": "#e8e0d2",
        "surface-dark": "#181715",
        "surface-dark-elevated": "#252320",
        "surface-dark-soft": "#1f1e1b",
        // Text
        ink: "#141413",
        "body-strong": "#252523",
        body: "#3d3d3a",
        muted: "#6c6a64",
        "muted-soft": "#8e8b82",
        "on-primary": "#ffffff",
        "on-dark": "#faf9f5",
        "on-dark-soft": "#a09d96",
        // Borders
        hairline: "#e6dfd8",
        "hairline-soft": "#ebe6df",
        "hairline-strong": "#d4c9bc",
        // Accent & Semantic
        "accent-teal": "#5db8a6",
        "accent-amber": "#e8a55a",
        success: "#5db872",
        warning: "#d4a017",
        error: "#c64545",
      },
      borderRadius: {
        none: "0px",
        soft: "2px",
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
        circle: "9999px",
      },
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
         "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Ubuntu",
          "sans-serif",
        ],
        serif: ["var(--font-serif)", "serif"],
        display: ["var(--font-serif)", "serif"],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-up-in": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-up-out": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        "slide-up-in": "slide-up-in 0.4s ease-out forwards",
        "slide-up-out": "slide-up-out 0.4s ease-in forwards",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
