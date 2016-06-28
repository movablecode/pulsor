//  test1.es6
import chai from 'chai';
let assert = chai.assert;
let expect = chai.expect;
let should = chai.should;
should();

import Pulsor from '../index';

describe('Pulsor Basic - Creation', ()=>{
  it ('Create', ()=>{
    assert(Pulsor);
    assert(Pulsor.getLocalCounter()===1);
  });
  it ('Define', ()=>{
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
    assert(user.set('id','sangmin.lna'));
    assert(user.set('name','sangmin'));
    assert(user.get('name')==='sangmin');
    user.set('age',17);
    user.save();
    let user2 = User.instance();
    assert(user2.set('id','movablecode'));
    user2.set('name','Movablecode');
    user2.set('age',43);
    user2.save();
    // Pulsor.confirmUpdateBuffer();
    // kk[user] = 1;
    // kk[user2] = 2;
    // assert(kk[user2]===2);
    // assert(kk[user]===1);
  });
  it ('Define 2', ()=>{
    let User2 = Pulsor.define('user2',{
      fields: [
        ['name',{nid:1}],
        'age',
        ['email',{nid:2}]
      ]
    });
    assert(User2.fieldCount()===4);
    assert(User2.field('email'));
    let field = User2.fieldN(2);
    assert(field);
    assert(field.Name==='email');
    assert(field.NID===2);
    let user2 = User2.instance();
    assert(user2.set('id','movablecode'));
    let send_buf;
    let c = {
      emit: (raw)=>{
        // send_buf = raw;
        send_buf = raw.slice();
        console.log('EMIT: ',raw);
      }
    }
    let sub = Pulsor.newSubscriber(c);
    c._sub = sub;
    sub.subscribe(user2);
    user2.set('name','Movablecode');
    user2.set('email','sangmin.lna@gmail.com');
    user2.set('age',41);
    user2.save();
    let obj = send_buf[0];
    let data = send_buf[1];
    assert(obj[0]==='user2');
    assert(obj[1]==='movablecode');
  });
  it ('Subscribers', ()=>{
    let c = {
      emit: (raw)=>{
        console.log('EMIT: ',raw);
      }
    }
    let sub = Pulsor.newSubscriber(c);
    c._sub = sub;
    let User = Pulsor.findModel('user');
    let user = User.instance();
    assert(user.set('id','movablecode'));
    sub.subscribe(user);
    assert(sub.subscriptionCount(user)===1);
    sub.obsolete();
    sub.setConsumer(c);
    sub.subscribe(user);
    assert(sub.subscriptionCount(user)===1);
    assert(user.set('name','sangmin'));
    assert(user.set('age',27));
    assert(user.set('name','sangmin')===false);
    user.save();
    sub.obsolete();
  });
  it ('Aliased Field Set', ()=>{
  });
});
