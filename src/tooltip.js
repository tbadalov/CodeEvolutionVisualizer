const React = require('react');
const tooltipStyle = require('./css/tooltip.css');

class Tooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible || false,
      left: this.props.left || 0,
      top: this.props.top || 0,
    };
  }

  show(position) {
    this.setState({
      visible: true,
      left: position.left,
      top: position.top,
    });
  }

  hide() {
    this.setState({
      visible: false,
    });
  }

  render() {
    return(
      <div className={"tooltip" + (this.state.visible ? " tooltip-active" : "")} style={{left: this.state.left + 'px', top: this.state.top + 'px'}}>
        <div className="tooltip-title">
          { this.props.title }
        </div>
        <div className="tooltip-body">
          { this.props.children || this.props.items }
        </div>
      </div>
    )
  }
}

module.exports = Tooltip;
