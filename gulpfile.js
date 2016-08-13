'use strict';

var gulp = require('gulp'),
  mocha = require('gulp-spawn-mocha');

gulp.task('test', function () {
  return gulp.src(['test/*.spec.js'], {
      read: false
    })
    .pipe(mocha({
      r: 'test/helpers/setup.js',
      istanbul: true
    }));
});

gulp.task('default', ['test'], function () {
});

gulp.task('watch', ['test'], function () {
  gulp.watch(['test/**/*.spec.js', 'lib/**/*.js'], ['test']);
});
