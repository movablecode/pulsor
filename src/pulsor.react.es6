//  pulsor.react.es6

export class PulsorReactComponent extends React.Component {

  //  assign initial properties
  //  update or insert data to Pulsor repository
  constructor(props) {
    super(props);
    let bindings = props.bindings;
    props.subscriptions = [];
    if (!isArray(bindings)) {
      bindings = [bindings];
    }
    let initial = {};
    bindings.forEach(binding=>{
      let model = binding.model;  delete binding.model;
      let id = binding.id;        delete binding.id;
      Object.assign(initial,binding);
      Pulsor.upsert(model,id,binding);
      props.subscriptions.push([model,id,binding.keys()]);
    });
    this.state = initial;
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.forEach(subs=>{
      Pulsor.mount([[subs[0],subs[1]],subs[2]], this);
    });
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    Pulsor.unmount(this);
  }

  //  emit publication (overrides)
  emit(obj) {
    let data = {};
    let index = 0;
    while (index<obj.length) {
      data[obj[index]] = obj[index+1];
      index += 2;
    }
    // arr.forEach(a=>{
    //   a[0].unsubscribe(this);
    // });

    this.setState(data);
  }

};

/*
*/
(()=>{
  //  bind Component Class to Pulsor.Component
  Pulsor.Component = PulsorReactComponent;
})();
