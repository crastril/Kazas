/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './*.html',
        './blog/**/*.html',
        './js/**/*.js',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#1e3d1f',
                'primary-light': '#2c582d',
                cream: '#F5F0E1',
                gold: '#D4AF37',
                'gold-light': '#ebd586',
                'surface-dark': '#0f140f',
            },
            fontFamily: {
                sans: ['Satoshi', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            borderRadius: {
                blob: '40% 60% 70% 30% / 40% 50% 60% 50%',
            },
            boxShadow: {
                glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-high': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                neon: '0 0 10px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.3)',
                squishy: 'inset 6px 6px 12px rgba(255, 255, 255, 0.4), inset -6px -6px 12px rgba(0, 0, 0, 0.05), 10px 10px 20px rgba(0,0,0,0.05)',
                'squishy-gold': 'inset 4px 4px 8px rgba(255, 215, 0, 0.4), inset -4px -4px 8px rgba(0, 0, 0, 0.1), 0px 10px 20px rgba(212, 175, 55, 0.3)',
            },
            animation: {
                float: 'float 8s ease-in-out infinite',
                'float-delayed': 'float 8s ease-in-out 4s infinite',
                morph: 'morph 8s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                morph: {
                    '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
                    '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
};
