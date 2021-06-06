module.exports = {
    devServer: {
        proxy: {
            '/': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
        },
        public: '0.0.0.0'
    },
    outputDir: 'dist/public',
    pages: {
        index: {
            entry: 'resources/js/app.js',
            template: 'public/index.html'
        },
        login: {
            entry: 'resources/js/login.js',
            template: 'public/login.html'
        }
    }
}
