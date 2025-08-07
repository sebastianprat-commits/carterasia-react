/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9eaff',
          200: '#b6d6ff',
          300: '#85b8ff',
          400: '#5595f6',
          500: '#2b6cb0',   // primario (azul)
          600: '#1f5490',
          700: '#1b4775',
          800: '#173a60',
          900: '#122c49',
        },
        accent: '#10b981',  // verde éxito
        ink: {
          700: '#1f2937',
          600: '#374151',
          500: '#4b5563',
          400: '#6b7280',
          300: '#9ca3af',
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
