const mix = require('laravel-mix');
require('mix-tailwindcss');

mix.js('resources/js/app.js', 'dist/public/js')
    .copy(['resources/favicon.ico', 'resources/*.html'], 'dist/public')
    .vue()
    .postCss('resources/css/app.css', 'dist/public/css')
    .tailwind()
    .options({
        terser: {
            extractComments: (astNode, comment) => false,
            terserOptions: {
                format: {
                    comments: false,
                },
            },
        },
    });
