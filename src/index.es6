//  index.es6
let local_counter = 0;

let isVoid = (v)=>{
  return ((v==='undefined') || (v===null));
}

let subscriber_pool = [];
/**
  Subscriber
*/
class Subscriber {
  constructor(consumer) {
    this._consumer = consumer;
    this._subscriptions = {};
  }
  setConsumer(consumer) {this._consumer = consumer;}
  addSubscription(p) {
    this._subscriptions[p] = true;
  }
  deleteSubscription(p) {
    delete this._subscriptions[p];
  }
  obsolete() {
    this._consumer = null;
    let arr = [];
    for (let k in this._subscriptions) {
      arr.push(this._subscriptions[k]);
    }
    arr.forEach(a=>{
      a.unsubscribe(this);
    });
    this._subscriptions = {};
  }
  dispose() {
    this.obsolete();
    subscriber_pool.push(this);
  }
  consume(raw) {
    if (this._consumer) {
      this._consumer.emit();
    }
  }
  emit(raw) {this.consume(raw);}
  static instance(consumer,fn) {
    let subs;
    if (subscriber_pool.length>0) {
      subs = subscriber_pool.pop();
      subs.setConsumer(ws);
    }
    else {
      subs = new Subscriber(consumer);
      // console.log("new WebSocketHandle created...");
    }
    if (fn) fn(consumer,subs);
    // ws.__wsh = subs;
    return subs;
  }
}

/**
  Publisher
*/
class Publisher {
  constructor(name) {
    this._pub_name = name;
    this._subscribers = {};
  }
  subscribe(s) {
    this._subscribers[s] = s;
    s.addSubscription(this);
  }
  unsubscribe(s) {
    s.deleteSubscription(this);
    delete this._subscribers[s];
  }
}

/**
  PulsorField
*/
class PulsorField extends Publisher {
  constructor(name) {
    super(name);
    this._name = name;
  }
}

class PulsorFieldInstance extends Publisher {
  constructor(name) {
    super(name);
    this._name = name;
  }
}

/**
  PulsorModel
*/
class PulsorModel extends Publisher {
  constructor(name) {
    super(name);
    this._name = name;
    this._fields = {};
    this._nfields = [];
    this.addField('id',{
      nid:0
    });
  }
  getName() {return this._name;}
  addField(name,opt={}) {
    let field = new PulsorField(name);
    // if (opt.nid) {
    if (!isVoid(opt.nid)) {
      this._nfields[opt.nid] = field;
    }
    this._fields[name] = field;
  }
  fieldCount() {return Object.keys(this._fields).length;}
  field(name) {return this._fields[name];}
  fieldN(nid) {return this._nfields[nid];}
  instance() {
    return new PulsorModelInstance(this);
  }
}

/**
  Pulsor Model Instance
*/
class PulsorModelInstance extends Publisher {
  constructor(model) {
    super(model.getName());
    this._model = model;
    this._fields = {};
  }
  getModel() {return this._model;}
  getModelName() {return this._model.getName();}
}


/**
  Pulsor Singleton
*/
class Pulsor {
  constructor() {
    local_counter++;
    this._models = {};
    this._schemas = {};
  }
  getLocalCounter() {return local_counter;}
  findModel(name) {return this._models[name];}

  /**
    define model
  */
  define(name,opt={}) {
    let model = new PulsorModel(name);
    this._models[name] = model;
    opt.fields = opt.fields || [];
    opt.fields.forEach(field_opt=>{
      switch (typeof field_opt) {
        case 'string':
          model.addField(field_opt,{});
          break;
        case 'object':
          if (v instanceof Array) {
            model.addField(field_opt[0],field_opt[1]);
          }
          else {
            model.addField(field_opt.name,field_opt);
          }
          break;
      } //  switch (typeof field_opt)
    });
  }
}

let pulsor = new Pulsor();
export default pulsor;
