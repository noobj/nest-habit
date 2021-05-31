module.exports = {
    purge: [
        './resources/*.html',
        './resources/**/*.js',
        './resources/**/*.vue'
    ],
    darkMode: 'media',
    plugins: [
        require('@tailwindcss/aspect-ratio')
    ],
};
