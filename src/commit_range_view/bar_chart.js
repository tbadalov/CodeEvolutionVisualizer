const React = require('react');
const GeneralDiagram = require('../general_diagram');
const { convertToVisualData } = require('./data_converter');
const constants = require('./constants');
const {
  SCALE_BY
} = constants;
const ColorContext = require('../contexts/color_context');
const { useContext, useEffect, useState } = require('react');
const { draw } = require('./diagram_sketcher');
const { usePrimitiveDiagramProps } = require('../common');
const { calculateLargestCommitSize, dataFromRange, calculateStageWidth } = require('./util');

/*const scrollContainerRef = React.createRef();
const largeContainerRef = React.createRef();*/

const defaultStageProps = {
  stageProps: {
    width: 0,
    height: 0,
  },
};

const defaultChartLayerProps = {
  scaleX: 1.0,
  scaleY: 1.0,
}

function BarChart(props) {
  const largeContainerRef = React.createRef();
  const colorContext = useContext(ColorContext);
  const [primitiveDiagramProps, setPrimitiveDiagramProps] = useState(defaultStageProps);
  const [chartLayerProps, setChartLayerProps] = useState(defaultChartLayerProps);
  const setScaleX = (scaleX) => {
    setChartLayerProps({
      ...chartLayerProps,
      scaleX,
    });
  };
  useEffect(() => {
    if (props.onZoom) {
      props.onZoom(chartLayerProps.scaleX);
    }
  }, [chartLayerProps.scaleX]);
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
  useEffect(() => {
    largeContainerRef.current.style.width = calculateStageWidth(props.commits) + 'px';
  }, [props.commits]);

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

  function onStageWheelEventListener(e) {
    if (e.evt.deltaX !== 0 || e.evt.deltaY === 0) {
      return;
    }
    const scaleBy = e.evt.deltaY > 0 ? SCALE_BY : 1.0 / SCALE_BY;
    scaleChartLayer(scaleBy, {
      chartLayerProps,
      setScaleX,
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
      largeContainerRef={largeContainerRef}
      onContainerScroll={onScroll}
      scrollLeft={diagramContainerLeftOffset}
      onWheel={onStageWheelEventListener}
      cursorStyle='auto'
      onDraw={onDraw}>
    </GeneralDiagram>
  );
}

function scaleChartLayer(scaleBy, params) {
  const oldScale = params.chartLayerProps.scaleX;
  const newScale = oldScale * scaleBy;
  params.setScaleX(newScale);
}

module.exports = BarChart;