const React = require('react');
const ReactKonva = require('react-konva');

function PrimitiveDiagram(props) {
  const konvaElements = props.onDraw ? props.onDraw() : null;
  return(
    <ReactKonva.Stage {...props.stageProps}>
      { konvaElements }
    </ReactKonva.Stage>
  );
}

module.exports = PrimitiveDiagram;
