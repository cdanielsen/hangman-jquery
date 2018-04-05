module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        node: true,
        globals: {
          node: true,
          jQuery: true
        },
      },
      files: [
        'Gruntfile.js',
        'index.js',
        'src/*.js',
        'controllers/*.js',

        'public/js/**/*.js',

        'test/*.js'
      ]
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: true,
        },
        src: [ 'test/**/*.js' ]
      },
    },

    watch: {
      js: {
        options: {
          spawn: true,
          interrupt: true,
          debounceDelay: 250,
        },
        files: [
          'Gruntfile.js',
          'index.js',
          'src/*.js',
          'controllers/*.js',

          'public/js/**/*.js',

          'test/*.js'
        ],
        tasks: [ 'test' ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);
  grunt.registerTask('w', ['watch:js']);
};