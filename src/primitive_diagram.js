const React = require('react');
const ReactKonva = require('react-konva');

function PrimitiveDiagram(props) {
  const konvaElements = props.convertDataToPrimitiveShapes();
  return(
    <ReactKonva.Stage {...props.stageProps}>
      { konvaElements }
    </ReactKonva.Stage>
  );
}

module.exports = PrimitiveDiagram;
