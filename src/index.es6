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
let isEmptyObject = (o)=>{
  return (Object.keys(o).length===0);
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

//
let pufp_buf = [];
function push_updated_field_publisher(fsp) {
  pufp_buf.push(fsp);
}
function flush_updated_field_publisher() {
  pufp_buf.forEach(a=>{
    a.flush();
  });
  clearArray(pufp_buf);
}
function confirm_ubuf() {
  console.log(ubuf);
}

/**
  Pulsor Updater
*/
class PulsorUpdater {
  constructor(publisher) {
    this._publisher = publisher;
    this._ubuf = [];
    this._instance = null;
    this._data = [];
    this._in_updating = false;
  }
  get Buffer() {return this._ubuf;}
  trySetFlushable() {
    if (!this._in_updating) {
      push_updated_field_publisher(this._publisher);
      this._in_updating = true;
    };
  }
  pushData(obj,index,value) {
    if (this._instance!==obj) {
      this._instance = obj;
      this._data = [];
      this._ubuf.push(obj.getPubId());
      this._ubuf.push(this._data);
    }
    this._data.push(index);
    this._data.push(value);
  }
  flush() {
    if (this._in_updating) {
      this._publisher.publishUp(this._ubuf,newPubSeq());
      this.clear();
      this._in_updating = false;
    }
  }
  clear() {
    clearArray(this._ubuf);
    this._instance = null;
    clearArray(this._data);
    this._in_updating = false;
  }
}

/**
  Subscriber
*/
class Subscriber {
  constructor(consumer) {
    this._id = newSubscriberID();
    this._consumer = consumer;
    this._subscriptions = {};
    this._updater = new PulsorUpdater(this);
  }
  get SubsID() {return this._id;}
  setConsumer(consumer) {this._consumer = consumer;}
  incSubscription(p,v=1) {
    let obj = this._subscriptions[p.PubNID];
    if (!obj) {
      obj = [p,1];
      this._subscriptions[p.PubNID] = obj;
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
      delete this._subscriptions[p.PubNID];
    }
  }
  subscribe(p) {
    if (!hasKey(this._subscriptions,p.PubNID)) {
      p.subscribe(this);
      return true;
    }
    else {
      this.incSubscription(p);
      return false;
    }
  }
  unsubscribe(p) {
    if (hasKey(this._subscriptions,p.PubNID)) {
      let obj = this.incSubscription(p,-1);
      if (obj[1]<1) {
        p.unsubscribe(this);
      }
      return true;
    }
    return false;
  }
  subscriptionCount(p) {
    let obj = this._subscriptions[p.PubNID];
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
  consume(data) {
    if (this._consumer) {
      this._consumer.emit(data);
    }
  }
  emit(data) {this.consume(data);}
  onPublish(data,seq) {this.consume(data);}
  pushPartial(obj,index,value) {
    if (this._consumer) {
      // this._consumer.pushPartial(obj,index,value);
      this._updater.pushData(obj,index,value);
      this._updater.trySetFlushable();
    }
  }
  flush() {
    this._updater.flush();
  }
  publishUp(buf,seq) {
    this.consume(buf);
  }
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
    this._pub_nid = newPublisherID();
    this._seq = 0;
  }
  get PubNID() {return this._pub_nid;}
  getPubId() {return this._pub_nid.toString();}
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
  hasSubscribers() {
    return ((this._subscribers) && (!isEmptyObject(this._subscribers)));
  }
  getSubscribers() {return this._subscribers;}
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
  onPublish(data,seq) {
    for (let k in this._subscribers) {
      let s = this._subscribers[k];
      s.consume(data);
    }
    return true;
  }
  publishUp(data,seq) {
    if (this._seq===seq) return false;
    this._seq = seq;
    let res = this.onPublish(data,seq);
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
  Field-Set Publisher
*/
class FieldSetPublisher extends Publisher {
  constructor() {
    super();
    this._updater = new PulsorUpdater(this);
    this._in_update_buffer = false;
  }
  onUpdate(data) {
    //  data maybe FieldInstance ...
    let fi;
    if (data.getNid()>-1) {
      if (data.getNid()>0) {
        fi = data.getNid();
      }
    }
    else {
      fi = data.getName();
    }
    if (fi) {
      this._updater.pushData(this,fi,data.get());
    }
    this._updater.trySetFlushable();
    return false;
  }
  flush() {
    this._updater.flush();
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

  getNid() {return this._nid;}
  getName() {return this._name;}
}


/**
  Pulsor Field Instance
*/
class PulsorFieldInstance extends Publisher {
  constructor(mi,field) {
    super();
    this._mi = mi;
    this._field = field;
    this._value = null;
  }
  getName() {return this._field.Name;}
  getNid() {return this._field.NID;}
  getFieldID() {
    if (this._field.NID>-1) {
      return this._field.NID;
    }
    return this._field.Name;
  }
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
  onUpdate(data) {
    if (this.hasSubscribers()) {
      let subs = this.getSubscribers();
      for (let k in subs) {
        let s = subs[k];
        // console.log(this._mi.getPubId(),this.getFieldID(),this.get());
        s.pushPartial(this._mi,this.getFieldID(),this.get());
      }
    }
    return true;
  }
}

/**
  Field Set Schema
*/
class PulsorFieldSet extends FieldSetPublisher {
  constructor() {
    super();
    this._model = null;         //  model schema
    this._change_only = true;   //  change only flag
    this._fields = {};
  }
  isChangeOnly() {return this._change_only;}
  setChangeOnly(v) {this._change_only=v;}
  addField(name) {
    let field = this._model.field(name);
    field.linkParent(this);
    this._fields[name] = field;
  }
  makeSnapshot(method='push') {
    let json = {};
    for (let k in this._fields) {
      let fi = this._fields[k];
      json[fi.getName()] = fi.get();
    }
    let obj = {jsonrpc:'2.0',method:method,params:json};
    return obj;
  }
  instance(model_instance) {
    this._mi = model_instance;
    return PulsorFieldSetInstance(this);
  }
}

/**
  Field Set Instance
*/
class PulsorFieldSetInstance extends FieldSetPublisher {
  constructor(field_set) {
    super();
    this._field_set = field_set;
  }
  onUpdate(data) {
    if (this._field_set.isChangeOnly()) {
      super.onUpdate(data);
    }
    else {
      this.trySetFlushable();
    }
    return false;
  }
  flush() {
    if (this._in_update_buffer) {
      let data;
      if (this._field_set.isChangeOnly()) {
        // data = this._ubuf;
        data = this._updater.Buffer;
        this.publishUp(data,newPubSeq());
        // clearArray(this._ubuf);
        this._updater.clear();
      }
      else {
        data = this._field_set.makeSnapshot();
        this.publishUp(data,newPubSeq());
      }
      this._in_update_buffer = false;
    }
  }
}


/**
  Pulsor Model
*/
class PulsorModel extends FieldSetPublisher {
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
class PulsorModelInstance extends FieldSetPublisher {
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
  getPubId() {return [this._model.getName(),this.getN(0)];}
  addField0(field) {
    let fi = new PulsorFieldInstance(this,field);
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
  getField(name) {
    return this._fields[name];
  }
  getFieldN(nid) {
    return this._nfields[index];
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
          if (field_opt instanceof Array) {
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
  newSubscriber(consumer,fn) {
    return Subscriber.instance(consumer,fn);
  }
  flushAll() {
    flush_updated_field_publisher();
  }
}

let pulsor = new Pulsor();
pulsor.PulsorFieldSet = PulsorFieldSet;
pulsor.PulsorFieldSetInstance = PulsorFieldSetInstance;

module.exports = pulsor;
