//  pulsor.react.es6

export class PulsorReactComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    super.componentDidMount();

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
