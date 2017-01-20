# Usage

## Update from HTTP Server

```javascript
var obj = [
  ["user","37"],
  [
    "name","sangmin",
    "email","sangmin.lna@gmail.com",
    "age",41
  ]
];
Pulsor.upsert(obj);
```


## Subscribe from React Component

```javascript
  // in React Component
  class Component1 extends Pulsor.Component {

    constructor(props) {
      super(props);
    }

    componentDidMount() {
      super.componentDidMount();
    }

    componentWillUnmount() {
      super.componentWillUnmount();
    }

  }
```



### Define Model

```javascript
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
```
