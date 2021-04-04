const GeneralDiagram = require('../general_diagram');

const { methodNamePosition } = require('./class_overview_diagram_positioner');
const React = require('react');
const ReactKonva = require('react-konva');
const constants = require('./constants');
const { usePrimitiveDiagramProps } = require('../common');
const { useEffect } = require('react');

const defaultStageProps = {
  stageProps: {
    width: constants.METHOD_NAME_COLUMN_WIDTH,
    height: 400,
  },
};

function ClassOverviewMethodLegend(props) {
  const [methodLegendStageProps, setStageHeight] = usePrimitiveDiagramProps(defaultStageProps);
  const visualizationData = convertToVisualData(props.methods);
  const konvaShapes = drawMethodLegend(visualizationData);
  const onDraw = () => konvaShapes;
  const methodLegendHeight = calculateStageHeight(visualizationData);
  useEffect(
    () => setStageHeight(methodLegendHeight),
    [methodLegendHeight]
  );
  //useEffect(() => scrollContainerRef.current.scrollTo(0, props.scrollTop));

  return (
    <GeneralDiagram
      width={constants.METHOD_NAME_COLUMN_WIDTH}
      height={methodLegendStageProps.stageProps.height}
      primitiveDiagramProps={methodLegendStageProps}
      scrollContainerRef={props.scrollContainerRef}
      onDraw={onDraw} />
  );
}

function convertToVisualData(methods) {
  return methods
    .map(method => method.methodName)
    .map(buildMethodLegend);
}

function buildMethodLegend(methodName, methodIndex) {
  return {
    type: 'text',
    fill: '#000000',
    text: methodName,
    ...methodNamePosition(methodIndex),
  };
}

function drawMethodLegend(methodLegendVisualData) {
  const methodNameShapes = methodLegendVisualData
    .map((methodNameVisualData, index) => (
      <ReactKonva.Text key={`method-name-${index}`}{...methodNameVisualData} />
    ));
  return (
    <ReactKonva.Layer key='method-legend'>
      <ReactKonva.Group>
        { methodNameShapes }
      </ReactKonva.Group>
    </ReactKonva.Layer>
  );
}

function calculateStageHeight(methodLegendVisualData) {
  const totalMethodCount = methodLegendVisualData.length;
  return constants.COLUMN_TOP_Y + constants.VERTICAL_MARGIN_FROM_TOP + totalMethodCount * constants.ROW_HEIGHT;
}

module.exports = React.memo(ClassOverviewMethodLegend);
