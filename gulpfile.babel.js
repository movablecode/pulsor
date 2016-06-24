import bc from 'babel-core/register';
import gulp from 'gulp';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import jshint from 'gulp-jshint';

//  set ES6 option
const babel_opt = {presets:['es2015']};
let build_list = [];
let watch_list = [];
let add_task_queue = (src,name)=>{
  build_list.push(name);
  watch_list.push([src,name]);
}

let src_build = (name,src_es6,dist_js)=>{
  gulp.task(name, ()=> {
    gulp.src(src_es6)
      .pipe(babel(babel_opt))
      .pipe(gulp.dest(dist_js))
      .pipe(mocha());
  });
};

src_build('build_index','src/index.es6','dist');

//  default tasks
gulp.task('default', ['build_index']);
