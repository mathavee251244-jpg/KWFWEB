/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#050c18',
          800: '#080f22',
          700: '#0c1630',
          600: '#111e40',
          500: '#172554',
        },
        win: {
          blue: '#0078d4',
          'blue-hover': '#106ebe',
          'blue-light': '#1890ff',
        },
      },
      fontFamily: {
        sans: ['"Sarabun"', '"Leelawadee UI"', '"Leelawadee"', '"Noto Sans Thai"', 'Tahoma', '"Cordia New"', '"Arial Unicode MS"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45)',
        window: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        'icon': '0 4px 20px rgba(0,0,0,0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
