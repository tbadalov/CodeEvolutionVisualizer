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
  const scale = scaleChartLayer.bind(null, {
    chartLayerProps,
    setScaleX: (scaleX) => {
      setChartLayerProps({
        ...chartLayerProps,
        scaleX,
      });
    },
  });

  (function adaptWidth() {
    const scaledStageWidth = calculateStageWidth(props.commits) * chartLayerProps.scaleX;
    useEffect(() => {
      largeContainerRef.current.style.width = scaledStageWidth + 'px'
    }, [chartLayerProps.scaleX, props.commits]);
  })();

  useEffect(() => {
    if (props.selectFromX !== undefined && props.selectToX !== undefined) {
      const selectedCommitHashes = dataFromRange(props.commits, {
        startX: props.selectFromX / chartLayerProps.scaleX,
        endX: props.selectToX / chartLayerProps.scaleX,
      }).map(selectedCommit => selectedCommit.commitHash);
      props.changeDiagram(
        'classOverviewView',
        {
          selectedCommitHashes,
          applicationName: props.applicationName,
        }
      );
    }
  }, [props.selectFromX, props.selectToX])

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
    startX: diagramContainerLeftOffset / chartLayerProps.scaleX,
    endX: (diagramContainerLeftOffset+primitiveDiagramProps.stageProps.width) / chartLayerProps.scaleX,
  });

  const visualData = convertToVisualData({
    commits: visibleCommits,
    largestCommitSize: props.maxValue,
    maxHeight: primitiveDiagramProps.stageProps.height - constants.BAR_BOTTOM_MARGIN,
    classToColorMapping: colorContext.classToColorMapping,
    isClassDisabled: props.isClassDisabled,
    scrollLeft: diagramContainerLeftOffset / chartLayerProps.scaleX,
    strokedStackCommitHash: props.strokedStackCommitHash,
    strokedStackClassName: props.strokedStackClassName,
    strokedStackBorderColor: props.strokedStackBorderColor,
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
    if (props.onContainerScroll) {
      props.onContainerScroll(e);
    }
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
    scale(scaleBy);
  }

  function onKeyDownEventListener(e) {
    let scaleBy = 1.0;
    switch(e.key) {
      case '-':
        scaleBy = 1.0 / SCALE_BY;
        break;
      case '+':
        scaleBy = SCALE_BY;
        break;
      default:
        return;
    }
    scale(scaleBy);
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDownEventListener);
    return function cleanup() {
      document.removeEventListener('keydown', onKeyDownEventListener);
    };
  })

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
      onDraw={onDraw}>
      { props.children }
    </GeneralDiagram>
  );
}

function scaleChartLayer(params, scaleBy) {
  const oldScale = params.chartLayerProps.scaleX;
  const newScale = oldScale * scaleBy;
  params.setScaleX(newScale);
}

module.exports = BarChart;