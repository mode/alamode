var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require('gulp-rename');
var package = require('./package.json')

gulp.task('compress-gh', function (cb) {
  pump([
    gulp.src('alamode.js'),
    uglify(),
    rename({
      basename: 'bundle',
      suffix: '.min'
    }),
    gulp.dest('build/gh')
  ], cb);
});

gulp.task('copy-gh', function (cb) {
  pump([
    gulp.src('alamode.js'),
    rename('bundle.js'),
    gulp.dest('build/gh')
  ]);
});

gulp.task('compress-s3', function (cb) {
  pump([
    gulp.src('alamode.js'),
    uglify(),
    rename({
      basename: 'bundle',
      suffix: '.min'
    }),
    gulp.dest('build/s3/' + package.version )
  ], cb);
});

gulp.task('copy-s3', function (cb) {
  pump([
    gulp.src('alamode.js'),
    rename('bundle.js'),
    gulp.dest('build/s3/' + package.version)
  ]);
});

gulp.task('build-gh', ['copy-gh', 'compress-gh'])
gulp.task('build-s3', ['copy-s3', 'compress-s3'])
gulp.task('default', ['build-gh', 'build-s3'])
