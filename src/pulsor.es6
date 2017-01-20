//  pulsor.es6

/*
  Queue : 성능 개선형 Queue 구현체, (Linked-List)
*/
function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};

/*
*/
(()=>{
  let local_counter = 0;
  let is_server = false;

  //
  //  utility functions
  //
  let isVoid = (v)=>{
    return ((v==='undefined') || (v===null));
  }
  let getKeyCount = (o)=>{
    return Object.keys(o).length;
  }
  let isArray = (o)=>{
    if (Array.isArray)
      return Array.isArray(o);
    else {
      return (o instanceof Array);
    }
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



  /**
    is Server ?
  */
  function isServer() {
    return (typeof window==='undefined');
  }

  /**
    default PulsorUpter setting.
  */
  let newPulsorUpdater = null;
  /**
    set server Flag, Pulsor Updater.
  */
  function thisIsServer() {
    global._G = global;
    is_server = true;
    newPulsorUpdater = (param)=> {
      return new PulsorUpdater(param);
    }
    // console.log('THIS IS SERVER:PULSOR');
  }
  /**
    set server Flag(=false), Pulsor Updater.
  */
  function thisIsBrowser() {
    // if (window) {
    //   window._G = window;
    // }
    is_server = false;
    newPulsorUpdater = (param)=> {
      return new PulsorViewUpdater(param);
    }
    // console.log('THIS IS BROWSER:PULSOR');
  }


  /**
    set server Flag, Pulsor Updater.
  */
  if (isServer()) {
    thisIsServer();
  }
  else {
    thisIsBrowser();
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

      aggregate, assemble updated fields for SERVER
      buffered, 
  */
  class PulsorUpdater {
    constructor(publisher) {
      this._publisher = publisher;
      this._ubuf = [];              //  updating buffer  ex) <[pub-id], [data], [pub-id], [data]...>
      this._instance = undefined;   //  current instance of Model. temporary.
      this._data = [];              //  updated key,data pairs
      this._in_updating = false;    //  in updating flag. temporary.

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
    Pulsor View Updater

      aggregate, assemble updated fields for BROWSER's View
      buffered, 
  */
  class PulsorViewUpdater {
    constructor(publisher) {
      this._publisher = publisher;
      this._ubuf = [];              //  updating buffer  ex) <object, [data], object, [data]...>
      this._instance = undefined;   //  current instance of Model. temporary.
      this._data = [];              //  updated key,data pairs
      this._in_updating = false;    //  in updating flag. temporary.
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
        // this._ubuf.push(obj.getPubId());
        this._ubuf.push(obj);
        this._ubuf.push(this._data);
      }
      this._data.push(index);   //  push key
      this._data.push(value);   //  push value
    }
    flush() {
      if (this._in_updating) {
        this._publisher.publishUp(this._ubuf,newPubSeq());
        this.clear();
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
      this._updater = newPulsorUpdater(this);
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
      this._updater = newPulsorUpdater(this);
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
    Pulsor Field : 항목 메타 객체
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
    Pulsor Field Instance : 실객체의 항목 인스턴스. 여기에 개별 구독 정보가 있다.
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
    Field Set Schema : preset. 구독단위로도 작용하고, 저장단위로도 작용한다. 2nd 인덱스를 두어 테이블에 series 로 저장이 가능하다.
      change_only : 변경된 항목만 실시간 전송된다.
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
    Field Set Instance : 필드셋의 실제 인스턴스. 여기에 개별 구독 정보가 있다.
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
    Pulsor Model : 모델 메타 객체.
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
      this._instances = {};
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
      return field;
    }
    fieldCount() {return Object.keys(this._fields).length;}
    field(name) {return this._fields[name];}
    fieldN(nid) {return this._nfields[nid];}
    instance() {
      return new PulsorModelInstance(this);
    }
    registerInstance(obj) {
      this._instances[obj.getID()] = obj;
      return true;
    }
    deregisterInstance(obj) {
      delete this._instances[obj.getID()];
      return true;
    }
    findInstance(id) {
      return this._instances[id];
    }
    gocInstance(id) {
      let obj = this.findInstance(id);
      if (!obj) {
        obj = this.instance();
        obj.set('id',id);
        this.registerInstance(obj);
      }
      return obj;
    }
  }


  /**
    Pulsor Model Instance : 실제 객체. PulsorModel 을 메타로 가진다.
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
    register() {
      this._model.registerInstance(this);
    }
    deregister() {
      this._model.deregisterInstance(this);
    }
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
      if (!field) {
        field = this._model.addField(name);
      }
      return this.addField0(field);
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
    gocField(name) {
      let fi = this._fields[name];
      if (!fi) {
        fi = this.addField(name);
      }
      return fi;
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
    purge() {
      //
    }
  }


  /**
    Pulsor Singleton : 전역 Pulsor 객체
  */
  class Pulsor {
    //  Constructor
    constructor() {
      local_counter++;
      this._models = {};
      this._schemas = {};
      this._action_q = new Queue();
      if (!isServer()) {
        setInterval(()=>{
          this.fetchAction();
        },100);
      };
    }
    getLocalCounter() {return local_counter;}

    //  Find Model
    findModel(name) {return this._models[name];}

    //  Get or Create Model
    gocModel(name) {
      let model = this._models[name];
      if (!model) {
        model = new PulsorModel(name);
        this._models[name] = model;
      }
      return model;
    }

    /**
      define model
    */
    define(name,opt={}) {
      //  set Model Name
      let model = this.gocModel(name);
      //  set Fields Definition
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
    //  Get Instance
    getInstance(model_name,id) {
      let model = findModel(model_name);
      if (model) {
        return model.findInstance(id);
      }
      return null;
    }
    //  Get or Create Instance
    gocInstance(model_name,id) {
      let model = gocModel(model_name);
      if (model) {
        return model.gocInstance(id);
      }
      return null;
    }
    getUpdateBuffer() {return ubuf;}
    confirmUpdateBuffer() {confirm_ubuf();}
    //  Create New Subscriber
    newSubscriber(consumer,fn) {
      return Subscriber.instance(consumer,fn);
    }
    flushAll() {
      flush_updated_field_publisher();
    }
    subscribe(model,id,fields,subs) {
      let ins = Pulsor.gocModel(model).gocInstance(id);
      fields.forEach(a=>{
        subs.subscribe( ins.gocField(a) );
      });
    }
    unsubscribe(model,id,fields,subs) {
      let ins = Pulsor.gocModel(model).gocInstance(id);
      fields.forEach(a=>{
        subs.unsubscribe( ins.gocField(a) );
      });
    }
    mount(model,id,fields,cons) {
      console.log(`Pulsor Mounted Model(${model}), ID(${id})`);
      if (!cons._sub) {
        cons._sub = Pulsor.newSubscriber(this);
      }
      this.subscribe(model,id,fields,cons._sub);
    }
    unmount(cons) {
      if (cons._sub) {
        cons._sub.dispose();
        cons._sub = null;
      }
      console.log('Pulsor Unmounted');
    }
    throwAction(cmd) {
      // let action = new PulsorAction(cmd);
      this._action_q.enqueue(cmd);
    }
    action(cmd) {
      this.throwAction(cmd);
    }
    fetchAction() {
      // console.log('fetch action');
      let item = this._action_q.dequeue();
      while (item) {
        // item.act();
        this.doAction(item);
        item = this._action_q.dequeue();
      }
    }
    doAction(item) {
      let cmd = item[0];
      let id_part,values,cb,params,topic;
      switch (cmd) {
        case 'U':       //  Upsert Object
          id_part = item[1];    //  ['user','anonymous']
          values = item[2];     //  ['name','anonymous','email':'anonymous@gmail.com']
          cb = item[3];         //  (m)=>{}
          break;
        case 'D':       //  Delete Object
          id_part = item[1];
          cb = item[2];
          break;
        case 'B':       //  Broadcast
          topic = item[1];      //  'm.mcounter.io'
          params = item[2];     //  {'age':21,email:'anonymous@gmail.com'}
          cb = item[3];
          break;
        default:
          break;
      }
    }
    setMode(mode) {
      if (mode==="server") {
        thisIsServer();
      }
      else if (mode==="browser") {
        thisIsBrowser();
      }
    }
    getMode() {
      if (is_server) return "server";
      else return "browser";
    }
    upsert(obj) {
      if (isArray(obj)) {
        //
      }
      else {
        //
      };
    }
  }

  let pulsor = new Pulsor();
  pulsor.PulsorFieldSet = PulsorFieldSet;
  pulsor.PulsorFieldSetInstance = PulsorFieldSetInstance;

  if (typeof window==='undefined') {
    module.exports = pulsor;
  }
  else {
    window.Pulsor = pulsor;
  }
})();
