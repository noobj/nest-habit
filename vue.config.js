const path = require('path');

module.exports = {
    devServer: {
        proxy: {
            '/': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
        public: '0.0.0.0:3001',
    },
    outputDir: 'dist/public',
    pages: {
        index: {
            entry: 'resources/js/app.js',
            template: 'resources/index.html',
        },
        login: {
            entry: 'resources/js/login.js',
            template: 'resources/login.html',
        },
    },
    // chainWebpack: (config) => {
    //     config.plugin('copy').tap((args) => {
    //         args[0].push({
    //             from: path.resolve(__dirname, 'resources/img'),
    //             to: path.resolve(__dirname, 'dist/public/img'),
    //             toType: 'dir',
    //             ignore: ['.DS_Store'],
    //         });
    //         return args;
    //     });
    // },
};
