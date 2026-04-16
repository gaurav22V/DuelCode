/** @type {import('tailwindcss').Config} */
export default {
  // This is the CRITICAL line for your theme toggle to work
  darkMode: 'class', 
  
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: '#0a0a0a',
      },
    },
  },
  plugins: [],
};