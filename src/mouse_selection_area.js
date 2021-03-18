const React = require('react');
const selectionRectangleStyle = require('./css/selection-rectangle.css');

function MouseSelectionArea(props) {
  const classNames = ['selection-rectangle'];
  const style = {};
  if (props.isActive) {
    classNames.push('selection-rectangle-active');
    Object.assign(
      style,
      {
        left: props.x,
        top: props.y,
        width: props.width,
        height: props.height,
      }
    );
  }

  return(
    <div
      className={classNames.join(' ')}
      style={style}
    ></div>
  );
}

module.exports = MouseSelectionArea;
