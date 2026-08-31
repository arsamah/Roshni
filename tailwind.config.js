/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Mirrors of the CSS custom properties in src/styles/tokens.css.
      // The raw vars stay the source of truth — the scroll engine writes
      // --north, --warm, --sky-t/m/b at runtime and Tailwind cannot.
      colors: {
        night: 'var(--night)',
        mist: 'var(--mist)',
        paper: 'var(--paper)',
        saffron: 'var(--saffron)',
        'saffron-bright': 'var(--saffron-bright)',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['"Instrument Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: { content: '1240px', prose: '820px' },
    },
  },
  plugins: [],
};
