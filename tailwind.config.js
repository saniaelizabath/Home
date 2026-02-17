/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a2e",
        blue: "#3B5BDB",
        coral: "#FF6B6B",
        mint: "#20C997",
        gold: "#FFD43B",
        "soft-blue": "#E8EEFF",
        "soft-coral": "#FFF0F0",
      },
      fontFamily: {
        caveat: ["Caveat", "cursive"],
        nunito: ["Nunito", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(4deg)" },
        },
        slideUp: {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        bgPan: {
          "0%": { transform: "scale(1.08) translateX(0)" },
          "50%": { transform: "scale(1.12) translateX(-2%)" },
          "100%": { transform: "scale(1.08) translateX(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "slide-up": "slideUp 0.8s ease both",
        "bg-pan": "bgPan 20s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
