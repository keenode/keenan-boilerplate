var gulp = require('gulp');

/*	--------------------------------------------------------
	+ GULP PLUGINS
	-------------------------------------------------------- */
var sass		= require('gulp-sass'),
	minifyCSS	= require('gulp-minify-css'),
	jshint		= require('gulp-jshint'),
	concat		= require('gulp-concat'),
	uglify		= require('gulp-uglify'),
	imagemin	= require('gulp-imagemin'),
	htmlbuild	= require('gulp-htmlbuild'),
	refresh		= require('gulp-livereload'),
	plumber		= require('gulp-plumber');


/*	--------------------------------------------------------
	+ NODE LIBS
	-------------------------------------------------------- */
var lrserver	= require('tiny-lr')(),
	express		= require('express'),
	livereload	= require('connect-livereload');


/*	--------------------------------------------------------
	+ SERVER PORTS
	-------------------------------------------------------- */
var	server_port		= 8000,
	livereload_port	= 35729;

// Start express server
var server = express();

// Add livereload middleware before static-middleware
server.use(livereload({
	port: livereload_port
}));
server.use(express.static('public'));


/*	--------------------------------------------------------
	+ BUILD ENVIRONMENT VARS
	-------------------------------------------------------- */
var env = 'dev';
var js_filename = 'main';
var css_filename = 'master';


/*	--------------------------------------------------------
	+ PATHS
	-------------------------------------------------------- */
var paths = {
	styles:				[
							'src/scss/**/*.{scss,sass}'
						],
	scripts_compile:	[
							'bower_components/jquery/dist/jquery.js',
							'src/scripts/' + js_filename + '.js'
						],
	scripts_dev:		[
							'scripts/full/jquery.js',
							'scripts/full/' + js_filename + '.js'
						],
	scripts_lint:		[
							'src/scripts/**/*.js',
							'!src/scripts/vendor/**/*.js'
						],
	images:				[
							'src/images/**/*.{png,jpg,gif}'
						],
	html:				[
							'src/index.html'
						],
};


/*	--------------------------------------------------------
	+ SET PROD
	--	Simply set environment to 'production'
	-------------------------------------------------------- */
gulp.task('set-prod', function() {
	env = 'prod';
});


/*	--------------------------------------------------------
	+ STYLES (DEV ONLY)
	--	Compile all SCSS/SASS files
	-------------------------------------------------------- */
gulp.task('styles-dev', function() {
    return gulp.src(paths.styles)
		.pipe(plumber())
		// Set errLogToConsole to 'true' to prevent gulp from
		// stopping on errors.
        .pipe(sass({ errLogToConsole: true }))
        .pipe(gulp.dest('public/css'))
        .pipe(refresh(lrserver));
});


/*	--------------------------------------------------------
	+ STYLES
	-- Compile and minify all SCSS/SASS files
	-------------------------------------------------------- */
gulp.task('styles', function() {
    return gulp.src(paths.styles)
		.pipe(plumber())
        .pipe(sass())
        .pipe(minifyCSS())
        .pipe(gulp.dest('public/css'))
        .pipe(refresh(lrserver));
});


/*	--------------------------------------------------------
	+ JAVASCRIPT LINTING
	-- Lint JavaScript
	-------------------------------------------------------- */
gulp.task('js-lint', function() {
	return gulp.src(paths.scripts_lint)
		.pipe(plumber())
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});


/*	--------------------------------------------------------
	+ COPY FULL JAVASCRIPT
	-- Copy full version of JavaScripts to public dir for
		development
	-------------------------------------------------------- */
gulp.task('copy-scripts', function() {
	return gulp.src(paths.scripts_compile)
		.pipe(plumber())
		.pipe(gulp.dest('public/scripts/full'))
		.pipe(refresh(lrserver));
});


/*	--------------------------------------------------------
	+ JAVASCRIPT
	--	Minify and concat JavaScript to public dir
	-------------------------------------------------------- */
gulp.task('scripts', function() {
	return gulp.src(paths.scripts_compile)
		.pipe(plumber())
		.pipe(uglify())
		.pipe(concat(js_filename + '.min.js'))
		.pipe(gulp.dest('public/scripts'))
		.pipe(refresh(lrserver));
});


/*	--------------------------------------------------------
	+ IMAGES
	--	Copy and minify all static images
	-------------------------------------------------------- */
gulp.task('images', function() {
	return gulp.src(paths.images)
		.pipe(plumber())
		.pipe(imagemin({optimizationLevel: 5}))
		.pipe(gulp.dest('public/images'))
		.pipe(refresh(lrserver));
});


/*	--------------------------------------------------------
	+ HTMLBUILD
	--	Write correct scripts into html files
	-------------------------------------------------------- */
gulp.task('htmlbuild', function() {
	gulp.src(paths.html)
		.pipe(plumber())
		.pipe(htmlbuild({
			js: function(files, callback) {
				if(env === 'prod')
					// Use minified scripts for production environment
					callback(null, [ 'scripts/' + js_filename + '.min.js' ]);
				else
					// Use full list of non-minified scripts for dev environment
					callback(null, paths.scripts_dev);
			}
		}))
		.pipe(gulp.dest('public'))
		.pipe(refresh(lrserver));
});


/*	--------------------------------------------------------
	+ SERVE
	--	Start up server and livereload for development
	-------------------------------------------------------- */
gulp.task('serve', function() {
	// Set up static fileserver, which serves files in the public dir
	server.listen(server_port);

	// Set up livereload server
	lrserver.listen(livereload_port);
});


/*	--------------------------------------------------------
	+ TASKS
	--	Rerun these task when files change
	-------------------------------------------------------- */
gulp.task('watch', function() {
	if(env === 'prod')
		gulp.watch(paths.styles, ['styles']);
	else
		gulp.watch(paths.styles, ['styles-dev']);
	gulp.watch(paths.scripts_compile,	['js-lint', 'copy-scripts', 'scripts']);
	gulp.watch(paths.images,			['images']);
	gulp.watch(paths.html,				['htmlbuild']);
});

// The default task (called when you run `gulp`)
gulp.task('default',	['styles-dev', 'js-lint', 'scripts', 'copy-scripts', 'images', 'htmlbuild', 'serve', 'watch']);
gulp.task('prod',		['set-prod', 'styles', 'js-lint', 'scripts', 'copy-scripts', 'images', 'htmlbuild', 'serve', 'watch']);