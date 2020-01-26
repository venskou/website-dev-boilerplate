'use strict';

// Declare plugins
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const htmlhint = require('gulp-htmlhint');
const prettyHtml = require('gulp-pretty-html');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const cssnano = require('gulp-cssnano');
const autoprefixer = require('gulp-autoprefixer');
const npmDist = require('gulp-npm-dist');
const rimraf = require('gulp-rimraf');
const imagemin = require('gulp-imagemin');
const svgmin = require('gulp-svgmin');
const svgstore = require('gulp-svgstore');
const cheerio = require('gulp-cheerio');
const babel = require('gulp-babel');

// Config directories
const dirs = {
  src: {
    html: 'src/*.html',
    styles: ['src/styles/styles.scss', 'src/styles/vendors/**/*.scss'],
    js: 'src/js/**/*.js',
    images: ['src/images/**/*.{png,jpg,gif}', '!src/images/favicon/**/*.*'],
    svg: ['src/images/**/*.svg', '!src/images/svg/sprite/**/*.svg', '!src/images/favicon/**/*.*'],
    svgSprite: 'src/images/svg/sprite/**/*.svg',
    favicon: 'src/images/favicon/**/*.*',
    fonts: 'src/fonts/**/*.*',
    vendors: 'src/vendors/'
  },
  dist: {
    html: 'dist/',
    styles: 'dist/styles/',
    js: 'dist/js/',
    images: 'dist/images/',
    svgSprite: 'dist/images/svg/sprite/',
    favicon: 'dist/images/favicon/',
    fonts: 'dist/fonts/',
    vendors: 'dist/vendors/'
  },
  watch: {
    html: 'src/*.html',
    styles: ['src/styles/**/*.scss', 'src/styles/vendors/**/*.scss'],
    js: 'src/js/**/*.js',
    images: ['src/images/**/*.{png,jpg,gif}', '!src/images/favicon/**/*.*'],
    svg: ['src/images/**/*.svg', '!src/images/svg/sprite/**/*.svg', '!src/images/favicon/**/*.*'],
    svgSprite: 'src/images/svg/sprite/**/*.svg',
    favicon: 'src/images/favicon/**/*.*',
    fonts: 'src/fonts/**/*.*',
  },
  clean: ['dist/*']
};

// Local Server
function server(done) {
  browserSync.init({
    server: {
      baseDir: './dist/',
      directory: true,
    },
    logPrefix: 'localhost',
    notify: false,
  });
  done();
}

// Reload local server
function reloadServer(done) {
  browserSync.reload();
  done();
}

// Clean dist folder
function clean() {
  return gulp.src(dirs.clean)
    .pipe(rimraf());
}

// Build HTML
function buildHTML() {
  return gulp.src(dirs.src.html)
    .pipe(prettyHtml({
      indent_size: 2,
      extra_liners: [],
    }))
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter())
    .pipe(gulp.dest(dirs.dist.html));
}

// Build styles
function buildStyles() {
  return gulp.src(dirs.src.styles)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded',
      indentWidth: 2
    }))
    .pipe(autoprefixer({
      cascade: true
    }))
    .pipe(gulp.dest(dirs.dist.styles))
    .pipe(cssnano())
    .pipe(rename({
      suffix: '.min',
      extname: '.css',
    }))
    .pipe(gulp.dest(dirs.dist.styles));
}

// Build JS
function buildJS() {
  return gulp.src(dirs.src.js)
    .pipe(plumber())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulp.dest(dirs.dist.js))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min',
      extname: '.js'
    }))
    .pipe(gulp.dest(dirs.dist.js));
}

// Build images
function buildImages() {
  return gulp.src(dirs.src.images)
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      })
    ]))
    .pipe(gulp.dest(dirs.dist.images));
}

// Build favicon
function buildFavicon() {
  return gulp.src(dirs.src.favicon)
    .pipe(gulp.dest(dirs.dist.favicon));
}

// SVG Optimization Config
const svgMinConfig = {
  plugins: [{
    removeDoctype: true
  }, {
    removeComments: true
  }, {
    removeViewBox: false
  }, {
    cleanupNumericValues: {
      floatPrecision: 2
    }
  }, {
    convertColors: {
      names2hex: true,
      rgb2hex: true
    }
  }, {
    cleanupIDs: {
      minify: true
    }
  }]
};

// Build SVG
function buildSVG() {
  return gulp.src(dirs.src.svg)
    .pipe(svgmin(function() {
      return svgMinConfig
    }))
    .pipe(gulp.dest(dirs.dist.images));
}

// Build SVG sprite
function buildSVGSprite() {
  return gulp.src(dirs.src.svgSprite)
    .pipe(svgmin(function() {
      return svgMinConfig
    }))
    .pipe(cheerio({
      run: function($) {
        $('svg').attr('width', null).attr('height', null);
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(cheerio({
      run: function($) {
        $('svg').attr('style', 'display: none');
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest(dirs.dist.svgSprite));
}

// Build vendors
function buildVendors() {
  return gulp.src(npmDist(), { base: './node_modules/' })
    .pipe(gulp.dest(dirs.src.vendors))
    .pipe(gulp.dest(dirs.dist.vendors));
}

// Build fonts
function buildFonts() {
  return gulp.src(dirs.src.fonts).pipe(gulp.dest(dirs.dist.fonts));
}

// Watch files
function watch() {
  gulp.watch(dirs.watch.html, gulp.series(buildHTML, reloadServer));
  gulp.watch(dirs.watch.styles, gulp.series(buildStyles, reloadServer));
  gulp.watch(dirs.watch.js, gulp.series(buildJS, reloadServer));
  gulp.watch(dirs.watch.images, gulp.series(buildImages, reloadServer));
  gulp.watch(dirs.watch.svg, gulp.series(buildSVG, reloadServer));
  gulp.watch(dirs.watch.svgSprite, gulp.series(buildSVGSprite, reloadServer));
  gulp.watch(dirs.watch.favicon, gulp.series(buildFavicon, reloadServer));
  gulp.watch(dirs.watch.fonts, gulp.series(buildFonts, reloadServer));
}

// Export tasks
exports.server = server;
exports.watch = watch;
exports.clean = clean;
exports.buildHTML = buildHTML;
exports.buildStyles = buildStyles;
exports.buildJS = buildJS;
exports.buildImages = buildImages;
exports.buildSVG = buildSVG;
exports.buildSVGSprite = buildSVGSprite;
exports.buildFavicon = buildFavicon;
exports.buildFonts = buildFonts;
exports.buildVendors = buildVendors;
const build = gulp.series(clean, buildVendors, gulp.parallel(buildHTML, buildStyles, buildJS, buildImages, buildFavicon, buildFonts, buildSVG, buildSVGSprite));
exports.build = build;

// Default task
exports.default = gulp.series(build, server, watch);