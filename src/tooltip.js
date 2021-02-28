const React = require('react');
const tooltipStyle = require('./css/tooltip.css');

class Tooltip extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div className="tooltip">
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
