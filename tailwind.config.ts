/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tells Tailwind where to look for class names to generate the necessary CSS.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Add your custom fonts here if needed
      },
      boxShadow: {
        "3d-blue": "0 40px 80px -20px rgba(59, 130, 246, 0.6)",
      },
      // All keyframe definitions are now correctly placed inside this single object.
      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0) rotateY(-8deg) rotateX(3deg)",
          },
          "50%": {
            transform: "translateY(-20px) rotateY(-10deg) rotateX(5deg)",
          },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale-up": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "text-glow": {
          "0%, 100%": { textShadow: "0 0 10px rgba(96, 165, 250, 0.7)" },
          "50%": { textShadow: "0 0 20px rgba(96, 165, 250, 1)" },
        },
        "pulse-border": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(96, 165, 250, 0.7)" },
          "50%": { boxShadow: "0 0 0 10px rgba(96, 165, 250, 0)" },
        },
        "active-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 10px rgba(6, 182, 212, 0.3), inset 0 0 4px rgba(6, 182, 212, 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 20px rgba(6, 182, 212, 0.5), inset 0 0 8px rgba(6, 182, 212, 0.3)",
          },
        },
      },
      // This section links the animation names to the keyframes you defined above.
      animation: {
        float: "float 6s ease-in-out infinite",
        "text-glow": "text-glow 3s ease-in-out infinite",
        "pulse-border": "pulse-border 3s ease-in-out infinite",
        "active-glow": "active-glow 3s ease-in-out infinite",
        "fade-in-down": "fade-in-down 0.5s ease-out forwards",
        "fade-in-scale-up": "fade-in-scale-up 0.5s ease-out forwards",
        "slide-in-left":
          "slide-in-left 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
        "slide-in-right":
          "slide-in-right 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
      },
    },
  },
  // Added plugins for more functionality.
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
};
