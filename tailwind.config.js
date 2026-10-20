/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        xinemax: {
          bg: "#0a0a0f",
          card: "#14141c",
          surface: "#1c1c26",
          orange: "#ff4d00",
          orangeHover: "#ff6a2b",
          orangeGlow: "rgba(255,77,0,0.5)",
          text: "#ffffff",
          muted: "#9ca3af",
          border: "#2a2a3a"
        }
      },
      fontFamily: {
        display: ["Inter","system-ui","sans-serif"],
        mono: ["JetBrains Mono","monospace"]
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
