const React = require('react');
const selectionRectangleStyle = require('./css/selection-rectangle.css');

class MouseSelectionArea extends React.PureComponent {
  constructor(props) {
    super(props);
    this.rectangleAreaRef = React.createRef();
  }

  render() {
    const classNames = ['selection-rectangle'];
    const style = {};
    if (this.props.isActive) {
      classNames.push('selection-rectangle-active');
      const sumOfTopAndBottomBorderWidths = this.rectangleAreaRef.current.offsetWidth - this.rectangleAreaRef.current.clientWidth;
      const divHeight = this.props.height - sumOfTopAndBottomBorderWidths;
      Object.assign(
        style,
        {
          left: this.props.x,
          top: this.props.y,
          width: this.props.width,
          height: divHeight || undefined,
        }
      );
    }

    return(
      <div
        className={classNames.join(' ')}
        style={style}
        ref={this.rectangleAreaRef}
      ></div>
    );
  }
}

module.exports = MouseSelectionArea;
