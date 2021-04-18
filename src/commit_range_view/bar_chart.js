const React = require('react');
const GeneralDiagram = require('../general_diagram');
const { convertToVisualData } = require('./data_converter');
const constants = require('./constants');
const ColorContext = require('../contexts/color_context');
const { useContext, useEffect, useState } = require('react');
const { draw } = require('./diagram_sketcher');
const { usePrimitiveDiagramProps } = require('../common');
const { calculateLargestCommitSize, dataFromRange } = require('./util');

/*const scrollContainerRef = React.createRef();
const largeContainerRef = React.createRef();*/

const defaultStageProps = {
  stageProps: {
    width: 0,
    height: 0,
  },
};

function BarChart(props) {
  const colorContext = useContext(ColorContext);
  const [primitiveDiagramProps, setPrimitiveDiagramProps] = useState(defaultStageProps);
  const [chartLayerProps, setChartLayerProps] = useState({});
  const [diagramContainerLeftOffset, setDiagramContainerLeftOffset] = useState(0);
  useEffect(() => {
    setPrimitiveDiagramProps({
      ...primitiveDiagramProps,
      stageProps: {
        ...primitiveDiagramProps.stageProps,
        width: props.width,
        height: props.height,
      }
    })
  }, [props.width, props.height]);
  const visibleCommits = dataFromRange(props.commits, {
    startX: diagramContainerLeftOffset,
    endX: diagramContainerLeftOffset+primitiveDiagramProps.stageProps.width,
  });

  const visualData = convertToVisualData({
    commits: visibleCommits,
    largestCommitSize: props.maxValue,
    maxHeight: primitiveDiagramProps.stageProps.height - constants.BAR_BOTTOM_MARGIN,
    classToColorMapping: colorContext.classToColorMapping,
    isClassDisabled: props.isClassDisabled,
    scrollLeft: diagramContainerLeftOffset,
  });
  console.log(visualData);
  const onDraw = () => draw(visualData, {
    ...props,
    chartLayerProps: {
      ...props.chartLayerProps,
      ...chartLayerProps,
    }
  });

  function onScroll(e) {
    props.onContainerScroll(e);
    setDiagramContainerLeftOffset(e.target.scrollLeft);
    setChartLayerProps({
      ...chartLayerProps,
    });
  }

  return(
    <GeneralDiagram {...props}
      rootStyle={{
        position: 'absolute',
        left: constants.Y_AXIS_WIDTH + 'px',
        width: props.width,
      }}
      primitiveDiagramProps={primitiveDiagramProps}
      scrollContainerRef={props.scrollContainerRef}
      largeContainerRef={props.largeContainerRef}
      onContainerScroll={onScroll}
      scrollLeft={diagramContainerLeftOffset}
      cursorStyle='auto'
      onDraw={onDraw}>
    </GeneralDiagram>
  );
}

module.exports = BarChart;