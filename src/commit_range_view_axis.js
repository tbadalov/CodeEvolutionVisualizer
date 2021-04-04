const { useEffect, useState } = require('react');
const GeneralDiagram = require('./general_diagram');
const ReactKonva = require('react-konva');
const React = require('react');

const BAR_WIDTH = 30;
const BAR_PADDING = 2;
const BAR_LAYER_LEFT_MARGIN = 40;
const Y_AXIS_WIDTH = 100;
const Y_AXIS_LINE_WIDTH = 6;
const LABEL_HEIGHT = 40;
const BAR_BOTTOM_MARGIN = LABEL_HEIGHT + 5;
const PADDING = 250;
const EMPTY_SPACE_TOP_PERCENTAGE = 10;
const AXIS_SEGMENT_COUNT = 7;

const defaultStageProps = {
  stageProps: {
    width: Y_AXIS_WIDTH,
    height: 0,
  },
};

export function CommitRangeViewAxis(props) {
  const scrollContainerRef = React.createRef();
  const [axisStageProps, setStageHeight] = useAxisStageProps();
  const stageHeight = axisStageProps.stageProps.height;
  useEffect(
    () => setStageHeight(scrollContainerRef.current.clientHeight),
    [stageHeight]
  );
  const axisVisualData = convertToVisualData({
    axisData: {
      maxValue: props.maxValue || 0,
    },
    stageHeight,
  }); console.log(axisVisualData);
  const konvaShapes = axisVisualData ? drawAxis(axisVisualData, stageHeight) : null;
  const onDraw = () => (
    <ReactKonva.Layer key='commit-range-view-axis-y-layer'>
      { konvaShapes }
    </ReactKonva.Layer>
  );

  return (
    <GeneralDiagram
      width={Y_AXIS_WIDTH}
      height={stageHeight}
      scrollContainerRef={scrollContainerRef}
      primitiveDiagramProps={axisStageProps}
      onDraw={onDraw} />
  );
}

function convertToVisualData({ axisData, stageHeight }) {
  if (stageHeight <= 0) {
    return null;
  }
  const axisX = (Y_AXIS_WIDTH - Y_AXIS_LINE_WIDTH) / 2;
  const axisY = stageHeight-BAR_BOTTOM_MARGIN
  const axisWidth = Y_AXIS_LINE_WIDTH;
  const axisHeight = stageHeight-BAR_BOTTOM_MARGIN;
  const segments = [];
  const numberOfSehmentsToDraw = axisData.maxValue > 0 ? AXIS_SEGMENT_COUNT: 0;
  for (let i = 0; i < numberOfSehmentsToDraw+1; i++) {
    segments.push({
      x: axisX - 5,
      y: stageHeight - BAR_BOTTOM_MARGIN - i * ((stageHeight-BAR_BOTTOM_MARGIN) / AXIS_SEGMENT_COUNT) + 4 / 2,
      width: 10,
      height: 4,
      scaleY: -1,
      label: Math.floor(i * (axisData.maxValue + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE * axisData.maxValue / 100.0)) / AXIS_SEGMENT_COUNT),
      fill: '#000000',
    });
  }

  return {
    line: {
      x: axisX,
      y: axisY,
      width: axisWidth,
      height: axisHeight,
      scaleY: -1,
      fill: '#000000',
    },
    segments: segments,
  };
}

function useAxisStageProps() {
  const [axisStageProps, setAxisStageProps] = useState(defaultStageProps);
  const setStageHeight = (stageHeight) => setAxisStageProps({
    ...axisStageProps,
    stageProps: {
      ...axisStageProps.stageProps,
      height: stageHeight,
    },
  });
  return [axisStageProps, setStageHeight, setAxisStageProps];
}

function drawAxis(axisVisualData, height) {
  const yAxisBackgroundColoringRectProps = {
    x: 0,
    y: 0,
    width: Y_AXIS_WIDTH,
    height: height,
    fill: '#F0F0F0',
  };

  return (
    <ReactKonva.Group key='commit-range-view-axis-y'>
      <ReactKonva.Rect key='commit-range-view-axis-y-background' {...yAxisBackgroundColoringRectProps} />
      <ReactKonva.Rect key='commit-range-view-axis-y-line' {...axisVisualData.line} />
      { axisVisualData.segments.map((segment, index) => <ReactKonva.Rect key={`commit-range-view-axis-y-segment-${index}`} {...segment} />) }
      {
        axisVisualData.segments.map(segment => ({
          text: segment.label,
          x: segment.x-20,
          y: segment.y-6,
        })).map((segment, index) => <ReactKonva.Text key={`commit-range-view-axis-y-segment-label-${index}`} {...segment} />)
      }
    </ReactKonva.Group>
  );
}
