const { useContext, useEffect, useState } = require('react');
const React = require('react');
const ReactKonva = require('react-konva');
const GeneralDiagram = require('../general_diagram');
const ColorContext = require('../contexts/color_context');
const constants = require('./constants');
const { columnTitlePosition, columnTitleHeight, columnTotalTitleFrameHeight } = require('./class_overview_diagram_positioner');
const { usePrimitiveDiagramProps } = require('../common');
const { calculateStageWidth } = require('./class_overview_diagram_sketcher');

const defaultStageProps = {
  stageProps: {
    width: 0,
    height: columnTotalTitleFrameHeight(),
  },
};

function ClassOverviewColumnTitles(props) {
  const largeContainerRef = props.largeContainerRef || React.createRef();
  const [cursorStyle, setCursorStyle] = useState('auto');
  const [columnTitlesStageProps,, setStageWidth] = usePrimitiveDiagramProps(defaultStageProps);
  const { branchToColorMapping } = useContext(ColorContext);
  const columnTitlesVisualData = convertToVisualData(props.columnTitles, {
    branchToColorMapping,
  });
  const konvaShapes = drawColumnTitles(columnTitlesVisualData, {
    setCursorStylePointer: setCursorStyle.bind(null, 'pointer'),
    setCursorStyleAuto: setCursorStyle.bind(null, 'auto'),
  });
  const onDraw = () => konvaShapes;
  const stageWidth = calculateStageWidth(columnTitlesVisualData.length);
  useEffect(
    () => {
      largeContainerRef.current.style.width = stageWidth + 'px';
      setStageWidth(stageWidth);
    },
    [stageWidth]
  );
  return (
    <React.Fragment>
      <GeneralDiagram 
        rootStyle={{
          position: 'absolute',
          left: constants.METHOD_NAME_COLUMN_WIDTH + 'px',
          top: (constants.COLUMN_TOP_Y-constants.TITLE_FRAME_STROKE_WIDTH) + 'px',
          height: columnTitlesStageProps.stageProps.height + 'px',
        }}
        hideScrollbar
        largeContainerRef={largeContainerRef}
        scrollContainerRef={props.scrollContainerRef}
        primitiveDiagramProps={columnTitlesStageProps}
        cursorStyle={cursorStyle}
        onDraw={onDraw} />
    </React.Fragment>
  )
}

function convertToVisualData(columnTitles, params) {
  return columnTitles
    .map(buildColumnTitle.bind(null, params));
}

function buildColumnTitle(params, columnTitleData, columnIndex) {
  const {
    branchToColorMapping,
  } = params;
  const title = columnTitleData.commitHash;
  const columnTitleText = columnTitleData.isAggregation ? '       ...' : title.substr(0, 8);
  const columnTitlePositionResult = columnTitlePosition(columnIndex, columnTitleText);
  columnTitlePositionResult.frame = {
    type: 'rect',
    fill: '#ffffff',
    stroke: branchToColorMapping[columnTitleData.branchName] || '#000000',
    strokeWidth: constants.TITLE_FRAME_STROKE_WIDTH,
    ...columnTitlePositionResult.frame,
  };
  columnTitlePositionResult.text = {
    type: 'text',
    text: columnTitleText,
    fill: '#000000',
    ...columnTitlePositionResult.text,
  };
  columnTitlePositionResult.payload = {
    isAggregation: columnTitleData.isAggregation,
    aggregatedColumns: columnTitleData.aggregatedColumns,
    columnIndex,
  };
  return columnTitlePositionResult;
}

function drawColumnTitles(columnTitlesVisualData, params) {
  const {
    setCursorStyleAuto,
    setCursorStylePointer,
  } = params;
  const konvaShapes = columnTitlesVisualData.map((columnTitleVisualData, columnIndex) => {
    const groupProps = {};
    if (columnTitleVisualData.payload.isAggregation) {
      groupProps.onMouseEnter = setCursorStylePointer;
      groupProps.onMouseLeave = setCursorStyleAuto;
    }
    return (
      <ReactKonva.Group key={`title-for-column-${columnIndex}`} {...groupProps}>
        <ReactKonva.Rect {...columnTitleVisualData.frame} />
        <ReactKonva.Text {...columnTitleVisualData.text} />
      </ReactKonva.Group>
    );
  });
  return (
    <ReactKonva.Layer key='class-overview-title-layer'>
      { konvaShapes }
    </ReactKonva.Layer>
  );
}

module.exports = React.memo(ClassOverviewColumnTitles);
