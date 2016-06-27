# Usage


### Define Model

var User = Pulsor.define('user',{
  fields: [
    'id',
    'name',
    'email',
    'age',
    'password',
    'bbpoint'
  ],
  field_set: {
    //
  }
});

var User = Pulsor.find('user','sangmin');
var u = User.instance();

//  <=  {id:'sangmin',name:''...}     found.
//  <=  'undefined'                   not found.

var list = Pulsor.select('user','');
User.select();

//  not suitable for wide-table.
//
