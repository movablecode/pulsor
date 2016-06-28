//  index.es6
let local_counter = 0;

//
//  functions
//
let isVoid = (v)=>{
  return ((v==='undefined') || (v===null));
}
let getKeyCount = (o)=>{
  return Object.keys(o).length;
}
let clearArray = (o)=>{
  o.length=0;
}
let mapCounter = (map,field,v=1)=>{
  map[field] = map[field] || 0;
  map[field] = map[field]+v;
  return map[field];
}
let hasKey = (o,key)=>{
  let key_type = typeof o[key];
  return ((key_type!=='undefined') && (key_type!==null));
}



//
//  Pub/Sub
//
let subscriber_pool = [];
let subscriber_seq = 0;

let newSubscriberID = ()=>{ return (++subscriber_seq).toString(); }

//  update buffer
let cur_mi;
let ubuf = [];  //  update buffer
let cur_fi_arr = [];

function push_ubuf(mi,fi,value) {
  if (cur_mi!==mi) {
    cur_mi = mi;
    //  push  [model_name,instance_id]
    ubuf.push([cur_mi.getModelName(),cur_mi.getID()]);
    //  push  [fi,value] pair
    cur_fi_arr = [];
    ubuf.push(cur_fi_arr);
  }
  cur_fi_arr.push(fi);
  cur_fi_arr.push(value);
}
function confirm_ubuf() {
  console.log(ubuf);
}
function clear_ubuf() {
  clearArray(ubuf);
  cur_mi = null;
}
function emit_ubuf() {

  clear_ubuf();
}


/**
  Subscriber
*/
class Subscriber {
  constructor(consumer) {
    this._id = newSubscriberID();
    this._consumer = consumer;
    this._subscriptions = {};
  }
  get SubsID() {return this._id;}
  setConsumer(consumer) {this._consumer = consumer;}
  incSubscription(p,v=1) {
    let obj = this._subscriptions[p.PubID];
    if (!obj) {
      obj = [p,1];
      this._subscriptions[p.PubID] = obj;
    }
    else obj[1] += v;
    return obj;
  }
  addSubscription(p) {
    this.incSubscription(p);
  }
  deleteSubscription(p) {
    let obj = this.incSubscription(p,-1);
    if (obj[1]<1) {
      delete this._subscriptions[p.PubID];
    }
  }
  subscribe(p) {
    if (!hasKey(this._subscriptions,p.PubID)) {
      p.subscribe(this);
      return true;
    }
    else {
      this.incSubscription(p);
      return false;
    }
  }
  unsubscribe(p) {
    if (hasKey(this._subscriptions,p.PubID)) {
      let obj = this.incSubscription(p,-1);
      if (obj[1]<1) {
        p.unsubscribe(this);
      }
      return true;
    }
    return false;
  }
  subscriptionCount(p) {
    let obj = this._subscriptions[p.PubID];
    if (obj) {
      return obj[1];
    }
    return 0;
  }
  obsolete() {
    this._consumer = null;
    let arr = [];
    for (let k in this._subscriptions) {
      arr.push(this._subscriptions[k]);
    }
    arr.forEach(a=>{
      a[0].unsubscribe(this);
    });
    this._subscriptions = {};
  }
  dispose() {
    this.obsolete();
    subscriber_pool.push(this);
  }
  consume(raw) {
    if (this._consumer) {
      this._consumer.emit(raw);
    }
  }
  emit(raw) {this.consume(raw);}
  onPublish(data) {this.consume(data);}
  static instance(consumer,fn) {
    let subs;
    if (subscriber_pool.length>0) {
      subs = subscriber_pool.pop();
      subs.setConsumer(consumer);
    }
    else {
      subs = new Subscriber(consumer);
    }
    if (fn) fn(consumer,subs);
    return subs;
  }
}


let publisher_seq = 0;
function newPublisherID() {return (++publisher_seq).toString();}
let pub_seq = 0;
function newPubSeq() {return pub_seq++;}

/**
  Publisher
*/
class Publisher {
  constructor() {
    // this._parents = {};
    this._pub_id = newPublisherID();
    this._seq = 0;
  }
  get PubID() {return this._pub_id;}
  linkParent(parent) {
    if (!this._parents) this._parents={};
    this._parents[parent] = parent;
  }
  unlinkParent(parent) {
    delete this._parents[parent];
  }
  getParents() {return this._parents;}
  subscribe(s) {
    if (!this._subscribers) {this._subscribers={};};
    this._subscribers[s.SubsID] = s;
    s.addSubscription(this);
  }
  unsubscribe(s) {
    s.deleteSubscription(this);
    delete this._subscribers[s.SubsID];
  }
  // setOnUpdate(fn) {this.onUpdate = fn;}
  /**
  */
  onUpdate(data) { return true; }
  /**
    update-Up: update processing hierarchical iterate until Updated false or has no-parents.
  */
  updateUp(data) {
    let res = this.onUpdate(data);
    if (!res) return false;
    if (this._parents) {
      if (getKeyCount(this._parents)>0) {
        for (let k in this._parents) {
          this._parents[k].updateUp(data);
        }
        return true;
      }
      else return false;
    }
  }
  onPublish(data) {
    for (let k in this._subscribers) {
      let s = this._subscribers[k];
      s.emit(data);
    }
    return true;
  }
  publishUp(data,seq) {
    if (this._seq===seq) return false;
    this._seq = seq;
    let res = this.onPublish(data);
    if (!res) return false;
    let parents = this._parents;
    if (parents) {
      if (getKeyCount(parents)>0) {
        for (let k in parents) {
          parents[k].publishUp(data,seq);
          // res = parents[k].publishUp(data,seq);
          // if (!res) return false;
        }
        return true;
      }
      else return false;
    }
  }
}


/**
  Pulsor Field
*/
class PulsorField extends Publisher {
  constructor(name,nid=-1) {
    super();
    this._name = name;
    this._nid = nid;
  }
  get Name() {return this._name;}
  get NID() {return this._nid;}
  set NID(v) {this._nid=v;}
}


/**
  Pulsor Field Instance
*/
class PulsorFieldInstance extends Publisher {
  constructor(field) {
    super();
    this._field = field;
    this._value = null;
  }
  getName() {return this._field.Name;}
  getNid() {return this._field.NID;}
  get() {return this._value;}
  set(value) {
    let affected = false;
    if (this._value!==value) {
      this._value = value;
      affected = true;
      this.updateUp(this);
    }
    return affected;
  }
}


/**
  Pulsor Model
*/
class PulsorModel extends Publisher {
  constructor(name) {
    super();
    this._name = name;
    this._fields = {};
    this._nfields = [];
    this.addField('id',{
      nid:0
    });
  }
  getName() {return this._name;}
  // getPubID() {return 'Model.'+this.getName();}
  addField(name,opt={}) {
    let field = new PulsorField(name);
    field.linkParent(this);
    let nid = opt.nid;
    if (isVoid(nid)) {nid=-1;};
    if (nid>-1) {
      field.NID = nid;
      this._nfields[nid] = field;
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
    this._nfields = [];
  }
  getModel() {return this._model;}
  getModelName() {return this._model.getName();}
  // getPubID() {return this._model.getName()+'.'+this.getN(0);}
  getID() {return this.getN(0);}
  addField0(field) {
    let fi = new PulsorFieldInstance(field);
    fi.linkParent(this);
    if (field.NID>-1) {
      this._nfields[field.NID] = fi;
    }
    this._fields[field.Name] = fi;
    return fi;
  }
  addField(name) {
    let field = this._model.field(name);
    if (field) {
      return this.addField0(field);
    }
    return null;
  }
  addFieldN(nid) {
    let field = this._model.fieldN(nid);
    if (field) {
      return this.addField0(field);
    }
    return null;
  }
  get(name) {
    let fi = this._fields[name];
    if (fi) {
      return fi.get();
    }
    return null;
  }
  set(name,value) {
    let fi = this._fields[name];
    if (!fi) {
      fi = this.addField(name);
    }
    if (fi) return fi.set(value);
    else return false;
  }
  getN(index) {
    let fi = this._nfields[index];
    if (fi) {
      return fi.get();
    }
    return null;
  }
  setN(index,value) {
    let fi = this._nfields[index];
    if (!fi) {
      fi = this.addFieldN(index);
    }
    if (fi) return fi.set(value);
    else return false;
  }
  onUpdate(data) {
    if (data.getNid()>-1) {
      if (data.getNid()>0) {
        push_ubuf( this, data.getNid(),data.get() );
      }
    }
    else {
      push_ubuf( this, data.getName(),data.get() );
    }
    return false;
  }
  save() {
    this.publishUp(ubuf,newPubSeq());
    clear_ubuf();
  }
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
    return model;
  }
  getUpdateBuffer() {return ubuf;}
  confirmUpdateBuffer() {confirm_ubuf();}
  save() {
    newPubSeq()
    //
  }
  newSubscriber(consumer,fn) {
    return Subscriber.instance(consumer,fn);
  }
}

let pulsor = new Pulsor();
export default pulsor;
