module.exports = {
    purge: [
        './public/*.html',
        './resources/**/*.js',
        './resources/**/*.vue'
    ],
    darkMode: 'media',
    plugins: [
        require('@tailwindcss/aspect-ratio')
    ],
};
