//  test_react.es6
import chai from 'chai';
let assert = chai.assert;
let expect = chai.expect;
let should = chai.should;
should();

import React from 'react';

require('../lib/Queue');
import Pulsor from '../pulsor';
_G.React = React;
_G.Pulsor = Pulsor;
require('../pulsor.react');

describe('Pulsor-React - Creation', ()=>{
  it ('Create', ()=>{
    assert(Pulsor);
    assert(Pulsor.getLocalCounter()===1);

    // let x = new Component1({
    //   bindings:{
    //     model: 'xxx',
    //     id: '',
    //   }
    // });

  });
});
