module.exports = {
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{js,jsx,ts,tsx,vue}'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    fontSize: {
      xxs: '.5rem',
      xs: '.75rem',
      sm: '.875rem',
      tiny: '.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
      '7xl': '5rem',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT:
        '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      hud: '1px 4px 4px rgba(0, 0, 0, 0.25)',
      right: '1px 0px 10px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none',
    },
    extend: {
      colors: {
        spotblue: '#3190FF',
        spotred: 'rgba(219, 61, 72, 1)',
        // spotgray: '#303030',
        spotgray: '#3E3E3E',
        spotgraylt: '#404040',
        spotgrayltst: '#8A8888',
        spotgraydk: '#191919',
      },
      borderRadius: {
        hud: '10px',
      },
      boxShadow: {
        hud: '1px 4px 4px 0px rgba(0,0,0, 0.25)',
      },
      width: {
        165: '165px',
        300: '300px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'reverse-spin': 'reverse-spin .25s linear',
      },
      keyframes: {
        'reverse-spin': {
          from: {
            transform: 'rotate(360deg)',
          },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
};
