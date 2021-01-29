const React = require('react');
const CallVolumeView = require('./call_volume_diagram');
const ItemList = require('../item_list');

class CallVolumeViewFull extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  handleItemClick() {

  }

  render() {
    console.log("full props");
    console.log(this.props.props.classToColorMapping);
    return(
      <div className="minu-container">
        <div className="box-1">
          <ItemList items={this.state.items} onItemChange={this.handleItemClick.bind(this)} />
        </div>
        <div className="box-2">
          <CallVolumeView
            data={this.state.data}
            classToColorMapping={this.props.props.classToColorMapping}
            disabledClasses={this.state.disabledClasses}
            onDiagramChange={this.props.changeDiagram} />
        </div>
      </div>
    );
  }
}

module.exports = CallVolumeViewFull;
