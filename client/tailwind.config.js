/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Semantic, theme-aware colours. Values resolve from CSS variables defined
      // in index.css (:root = light / Scandinavian, :root.dark = industrial luxury).
      colors: {
        base: 'rgb(var(--c-base) / <alpha-value>)',
        'base-alt': 'rgb(var(--c-base-alt) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--c-surface-3) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-2': 'rgb(var(--c-line-2) / <alpha-value>)',
        fg: 'rgb(var(--c-fg) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-2': 'rgb(var(--c-accent-2) / <alpha-value>)',
        solid: 'rgb(var(--c-solid) / <alpha-value>)',
        'on-solid': 'rgb(var(--c-on-solid) / <alpha-value>)',
        whatsapp: '#25d366',
        'whatsapp-dark': '#1da851',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '1320px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
      },
      letterSpacing: {
        brand: '0.16em',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        // Hero hanger wall: the track holds two identical blocks, so moving it
        // from -50% to 0 drifts it downwards and loops with no visible seam.
        drift: {
          '0%': { transform: 'translate3d(0,-50%,0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease both',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        drift: 'drift 110s linear infinite',
      },
    },
  },
  plugins: [],
};
