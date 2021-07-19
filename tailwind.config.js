const path = require('path');

module.exports = {
    purge: [
        './public/*.html',
        './resources/**/*.js',
        './resources/**/*.vue',
        path.resolve(__dirname, './node_modules/vue-tailwind-picker/**/*.js')
    ],
    darkMode: 'media',
    plugins: [
        require('@tailwindcss/aspect-ratio')
    ],
};
