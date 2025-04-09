module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // Add your custom fonts here if needed
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "text-glow": "text-glow 3s ease-in-out infinite",
        "pulse-border": "pulse-border 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0) rotateY(-8deg) rotateX(3deg)",
          },
          "50%": {
            transform: "translateY(-20px) rotateY(-10deg) rotateX(5deg)",
          },
        },
        "text-glow": {
          "0%, 100%": { textShadow: "0 0 10px rgba(96, 165, 250, 0.7)" },
          "50%": { textShadow: "0 0 20px rgba(96, 165, 250, 1)" },
        },
        "pulse-border": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(96, 165, 250, 0.7)" },
          "50%": { boxShadow: "0 0 0 10px rgba(96, 165, 250, 0)" },
        },
      },
      boxShadow: {
        "3d-blue": "0 40px 80px -20px rgba(59, 130, 246, 0.6)",
      },
    },
  },
};
