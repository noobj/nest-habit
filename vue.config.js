module.exports = {
  outputDir: 'dist/public',
  pages: {
    index: {
      entry: 'resources/js/app.js',
      template: 'resources/index.html'
    },
    login: {
      entry: 'resources/js/login.js',
      template: 'resources/login.html'
    }
  }
}
