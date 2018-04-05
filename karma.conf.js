module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: [ 'mocha' ],
    files: [
      '*.js',
      'test/*.spec.js'
    ],
    browsers: [ 'PhantomJS' ],
    singleRun: true,
    reporters: [
      'progress',
      'coverage'
    ],
    preprocessors: {
      '*.js': [ 'coverage' ]
    }
  })
}