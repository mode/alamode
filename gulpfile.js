var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var del = require('del');
var package = require('./package.json');

var paths = {
  entry: 'alamode.js',
  scss: 'alamode.scss',
  s3Dest: 'build/s3/' + package.version,
  ghDest: 'build/gh',
};

gulp.task('styles', function() {
  pump([
    gulp.src(paths.scss),
    sass().on('error', sass.logError),
    gulp.dest(paths.ghDest),
    gulp.dest(paths.s3Dest)
  ]);
});

gulp.task('min-styles', function() {
  pump([
    gulp.src(paths.scss),
    sass({ outputStyle: 'compressed' }).on('error', sass.logError),
    rename({ suffix: '.min' }),
    gulp.dest(paths.ghDest),
    gulp.dest(paths.s3Dest)
  ]);
});

gulp.task('scripts', function (cb) {
  pump([
    gulp.src(paths.entry),
    gulp.dest(paths.ghDest),
    gulp.dest(paths.s3Dest),
    uglify(),
    rename({
      suffix: '.min'
    }),
    gulp.dest(paths.ghDest),
    gulp.dest(paths.s3Dest)
  ], cb);
});

gulp.task('clean', function () {
  return del.sync(['build'], {dot: true});
});

gulp.task('build', ['styles', 'min-styles', 'scripts'])
gulp.task('default', ['clean', 'build'])
