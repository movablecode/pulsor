import bc from 'babel-core/register';
import gulp from 'gulp';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import jshint from 'gulp-jshint';

//  set ES6 option
const babel_opt = {presets:['es2015']};
let build_list = [];
let watch_list = [];
let add_task_queue = (name,src,dist_js)=>{
  build_list.push(name);
  watch_list.push([src,name]);
}

let src_copy = (name,src,dist)=>{
  add_task_queue(name,src,dist);
  gulp.task(name, ()=> {
    gulp.src(src)
      .pipe(gulp.dest(dist));
  });
}

let src_build = (name,src_es6,dist_js)=>{
  add_task_queue(name,src_es6,dist_js);
  gulp.task(name, ()=> {
    gulp.src(src_es6)
      .pipe(babel(babel_opt))
      .pipe(gulp.dest(dist_js));
  });
};

let src_build_test = (name,src_es6,dist_js)=>{
  add_task_queue(name,src_es6,dist_js);
  gulp.task(name, ()=> {
    gulp.src(src_es6)
      .pipe(babel(babel_opt))
      .pipe(gulp.dest(dist_js))
      .pipe(mocha());
  });
};

// src_build('build_index','src/index.es6','dist');
src_copy('copy_lib','src/lib/*.js','dist/lib');
src_build('build','src/pulsor.es6','dist');
src_build_test('build_test','src/test/*.es6','dist/test');

//  build all
gulp.task('build_all', ['copy_lib','build','build_test'], ()=>{
  //
});

//  watch modified files
gulp.task('watch', ['build_all'], ()=> {
  watch_list.forEach(o=>{
    gulp.watch(o[0],[o[1]]);
  });
  // gulp.watch('dist/test',['test']);
});


//  default tasks
gulp.task('default', ['build_all']);
