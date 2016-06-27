//  test1.es6
import chai from 'chai';
let assert = chai.assert;
let expect = chai.expect;
let should = chai.should;
should();

import Pulsor from '../index';

describe('Pulsor Basic - Creation', ()=>{
  it ('CREATE', ()=>{
    assert(Pulsor);
    assert(Pulsor.getLocalCounter()===1);
  });
  it ('DEFINE', ()=>{
    Pulsor.define('user',{
      fields: [
        'name',
        'age'
      ]
    });
    let User = Pulsor.findModel('user');
    assert(User);
    assert(User.fieldCount()===3);
    assert(User.field('age'));
    assert(User.fieldN(0));
    let user = User.instance();
    assert(user);
    assert(user.getModelName()==='user');
    let kk = {};
    kk[user] = true;
    // console.log(kk);
    assert(kk[user]);
    delete kk[user];
    assert(!kk[user]);
    // assert(!kk[user]=='undefined');
  });
});
