/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFAF5',
          100: '#FDF1E6', // Figma background
          200: '#F7E3CF',
          300: '#EED1B4',
          400: '#DFB892',
          500: '#C79A70',
        },
        primary: {
          DEFAULT: '#D9700F', // Figma primary orange
          hover: '#C25F09',
          light: '#FFF2E5',
          dark: '#B05305',
        },
        dark: {
          heading: '#6B3A0A', // Figma deep brown
          body: '#2D1B0D',
          muted: '#7C6757',
        },
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(107, 58, 10, 0.06)',
        'card': '0 2px 12px 0 rgba(107, 58, 10, 0.05)',
        'float': '0 10px 30px -4px rgba(217, 112, 15, 0.15)',
      },
    },
  },
  plugins: [],
};
