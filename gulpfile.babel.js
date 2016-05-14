/* global __dirname */

// gulp.task formatting prefers braces for all callbacks
/* eslint arrow-body-style: [2, "always"] */

import babel from 'gulp-babel';
import clean from 'gulp-rimraf';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import mocha from 'gulp-mocha';
import path from 'path';
import postcss from 'postcss';
import real from 'postcss-parser-tests/real';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import through from 'through';
import uglify from 'gulp-uglify';
import util from 'gulp-util';

const config = {
    dirs: {
        lib: path.join(__dirname, 'lib'),
        test: path.join(__dirname, 'test'),
        build: path.join(__dirname, 'build'),
        dist: path.join(__dirname, 'dist')
    },
    builds: {
        lib: 'lib',
        test: 'test'
    },
    test: {
        reporter: 'spec'
    }
};

function lint (srcPath) {
    return gulp
        .src(srcPath)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

gulp.task('default', ['test']);

gulp.task('config', () => {
    util.log(JSON.stringify(config, null, 2));
});

// Clean

gulp.task('clean', ['clean:all']);

gulp.task('clean:all', ['clean:build', 'clean:dist']);

gulp.task('clean:lib', () => {
    return gulp
        .src(path.join(config.dirs.build, config.builds.lib), {read: false})
        .pipe(clean());
});

gulp.task('clean:test', () => {
    return gulp
        .src(path.join(config.dirs.build, config.builds.test), {read: false})
        .pipe(clean());
});

gulp.task('clean:build', () => {
    return gulp
        .src(config.dirs.build, {read: false})
        .pipe(clean());
});

gulp.task('clean:dist', () => {
    return gulp
        .src(path.join(config.dirs.dist), {read: false})
        .pipe(clean());
});

// Build

gulp.task('build', ['build:all']);
gulp.task('build:all', ['build:lib', 'build:test']);

gulp.task('build:lib', ['clean:lib'], () => {
    return gulp
        .src(path.join(config.dirs.lib, '**', '*.js'))
        .pipe(babel())
        .pipe(gulp.dest(path.join(config.dirs.build, config.builds.lib)));
});

gulp.task('build:test', ['clean:test', 'build:lib'], () => {
    return gulp
        .src(path.join(config.dirs.test, '**', '*.js'))
        .pipe(babel())
        .pipe(gulp.dest(path.join(config.dirs.build, config.builds.test)));
});

// Lint

gulp.task('lint', ['lint:all']);

gulp.task('lint:all', ['lint:lib', 'lint:test', 'lint:root']);

gulp.task('lint:lib', () => {
    return lint(path.join(config.dirs.lib, '**', '*.js'));
});

gulp.task('lint:test', () => {
    return lint(path.join(config.dirs.test, '**', '*.js'));
});

gulp.task('lint:root', () => {
    return lint(path.join(__dirname, '*.js'));
});

// Test

gulp.task('test', ['lint', 'test:run']);

gulp.task('test:all', (done) => {
    runSequence('lint', 'test:run', 'test:integration', done);
});

gulp.task('test:run', ['build:test'], () => {
    return gulp
        .src(path.join(config.dirs.build, config.builds.test, '**', '*.spec.js'), {read: false})
        .pipe(mocha({
            reporter: config.test.reporter
        }))
        .on('error', function () {
            // eslint-disable-next-line no-invalid-this
            this.emit('end');
        });
});

gulp.task('test:integration', ['build:lib'], (done) => {
    // this require is only available after running the build:lib task
    // eslint-disable-next-line global-require
    const lessSyntax = require('./build/lib/less-syntax').default;

    real(done, (css) => {
        return postcss()
            .process(css, {
                parser: lessSyntax,
                map: {annotation: false}
            });
    });
});

gulp.task('test:integration:local', ['build:lib'], () => {
    // create file in root source directory called integration.css to process

    // this require is only available after running the build:lib task
    // eslint-disable-next-line global-require
    const lessSyntax = require('./build/lib/less-syntax').default;

    return gulp
        .src(path.join(__dirname, 'integration.css'))
        .pipe(through((file) => {
            try {
                // we need to access .css as it is a lazy property
                // eslint-disable-next-line no-unused-vars
                const css = postcss().process(file.contents.toString(), {
                    parser: lessSyntax,
                    map: {annotation: false}
                }).css;

                util.log(util.colors.green('VALID'));
            } catch (err) {
                util.log(util.colors.red('ERROR'), err.message, err.stack);
            }
        }));
});

// Watch

gulp.task('watch', ['watch:test']);

gulp.task('watch:lint', ['lint'], () => {
    return gulp
        .watch([
            path.join(config.dirs.lib, '**', '*.js'),
            path.join(config.dirs.test, '**', '*.js'),
            path.join(__dirname, '*.js')
        ], ['lint']);
});

gulp.task('watch:test', ['test:run'], () => {
    return gulp
        .watch([
            path.join(config.dirs.lib, '**', '*.js'),
            path.join(config.dirs.test, '**', '*.js')
        ], ['test:run']);
});

// Dist

gulp.task('dist', ['build:lib'], () => {
    gulp
        .src(path.join(config.dirs.build, config.builds.lib, '**', '*.js'))
        .pipe(gulp.dest(config.dirs.dist));

    gulp
        .src(path.join(config.dirs.build, config.builds.lib, '**', '*.js'))
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(config.dirs.dist));
});
