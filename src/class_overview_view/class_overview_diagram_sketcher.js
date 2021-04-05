const React = require('react');
const ReactKonva = require('react-konva');
const constants = require('./constants');
const {
  columnPosition,
  methodPosition,
  columnLineDashPosition,
  methodNamePosition,
  columnTitlePosition,
  rowPosition,
} = require('./class_overview_diagram_positioner');

function drawColumnLine(columnLine) {
  const columnIndex = columnLine.payload;
  return (
    <ReactKonva.Group key={`line-for-column-${columnIndex}`}>
      { columnLine.dashes.map((columnDash, index) => <ReactKonva.Rect key={`dash-${index}-for-column-${columnIndex}`} {...columnDash} />) }
    </ReactKonva.Group>
  );
}

function drawColumnTitle(columnTitle) {
  const columnIndex = columnTitle.payload;
  return (
    <ReactKonva.Group key={`title-for-column-${columnIndex}`}>
      <ReactKonva.Rect {...columnTitle.frame} />
      <ReactKonva.Text {...columnTitle.text} />
    </ReactKonva.Group>
  )
}

function drawColumnMethods(columnMethods) {
  const { columnIndex } = columnMethods.payload; 
  return (
    <ReactKonva.Group key={`methods-for-column-${columnIndex}`}>
      { columnMethods.methods.map((columnMethod, index) => <ReactKonva.Circle key={`method-${index}-for-column-${columnIndex}`} {...columnMethod} />) }
    </ReactKonva.Group>
  );
}

function drawColumnMethodArrows(arrows) {
  for (let i = 0; i < arrows.length; i++) {
    //layer.add(new Konva.Circle(columnMethods[i]));
  }
  return null;
}

function drawMethodLegend(methodNames) {
  return (
    <ReactKonva.Group key='method-legend'>
      { methodNames.map((methodName, index) => <ReactKonva.Text key={`method-legend-${index}`} {...methodName} />) }
    </ReactKonva.Group>
  );
}

function buildColumnTitle(columnIndex, columnData, branchToColorMapping) {
  const title = columnData.commitHash;
  const columnTitleText = title.substr(0, 8);
  const columnTitlePositionResult = columnTitlePosition(columnIndex, columnTitleText);
  columnTitlePositionResult.frame = {
    type: 'rect',
    fill: '#ffffff',
    stroke: branchToColorMapping[columnData.branchName] || '#000000',
    strokeWidth: 3,
    ...columnTitlePositionResult.frame,
  };
  columnTitlePositionResult.text = {
    type: 'text',
    text: columnTitleText,
    fill: '#000000',
    ...columnTitlePositionResult.text,
  };
  columnTitlePositionResult.payload = {
    columnIndex,
  };
  return columnTitlePositionResult;
}

function buildMethodLegend(allMethodNames) {
  return allMethodNames.map((methodName, index) => {
    return {
      type: 'text',
      ...methodNamePosition(index),
      fill: '#000000',
      text: methodName,
    };
  });
}

function buildColumnMethods(columnIndex, columnRows) {
  const methods = Object.keys(columnRows).map(rowNumber => ({
    ...columnRows[rowNumber],
    row: rowNumber,
  })).map(rowElement => {
    const {
      circleRadius,
      circleX,
      circleY,
    } = methodPosition(columnIndex, rowElement.row);
    return {
      type: 'circle',
      x: circleX,
      y: circleY,
      radius: circleRadius,
      fill: rowElement.status === 'new' ? 'blue' : (rowElement.status === 'changed' ? 'green' : 'gray'),
      payload: {},
    };
  });
  return {
    methods,
    payload: {
      columnIndex,
    },
  };
}

function buildColumnLine(columnIndex, totalRowCount) {
  const numberOfDashes = (totalRowCount * constants.ROW_HEIGHT) / (constants.DASH_HEIGHT+constants.DASH_VERTICAL_MARGIN);
  const dashes = [];
  for (let i = 0; i < numberOfDashes; i++) {
    const {
      dashStartY,
      dashStartX,
      dashHeight,
      dashWidth,
    } = columnLineDashPosition(columnIndex, i);
    dashes.push({
      type: 'rect',
      x: dashStartX,
      y: dashStartY,
      height: dashHeight,
      width: dashWidth,
      fill: '#000000',
      payload: {},
    });
  }
  return {
    dashes,
    payload: {
      columnIndex,
    },
  };
}

export function calculateStageHeight(totalMethodCount) {
  return constants.COLUMN_TOP_Y + constants.VERTICAL_MARGIN_FROM_TOP + totalMethodCount * constants.ROW_HEIGHT;
}

export function calculateStageWidth(totalCommitsCount) {
  return constants.METHOD_NAME_COLUMN_WIDTH + totalCommitsCount * constants.COLUMN_WIDTH;
}

function convertToVisualizationData(groupedData, branchToColorMapping, disabledBranches) {
  const data = {
    columns: [],
  };
  let disabledColumnsCount = 0;
  for (let i = 0; i < groupedData.columns.length; i++) {
    if (disabledBranches[groupedData.columns[i].branchName]) {
      disabledColumnsCount++;
      continue;
    }
    const columnIndex = i-disabledColumnsCount;
    const columnLine = buildColumnLine(columnIndex, Object.keys(groupedData.methodNameToRowNumberMapping).length);
    const methods = buildColumnMethods(columnIndex, groupedData.columns[i].row);
    console.log(methods);
    const arrows = [];
    data.columns.push({
      columnLine,
      methods,
      arrows,
    });
  }
  return data;
}

export function draw(groupedData, onCommitClick, branchToColorMapping, disabledBranches) {
  const visualizationData = convertToVisualizationData(
    groupedData,
    branchToColorMapping,
    disabledBranches
  );
  const stageSize = {
    width: calculateStageWidth(visualizationData.columns.length),
    height: calculateStageHeight(Object.keys(groupedData.methodNameToRowNumberMapping).length),
  };
  console.log(visualizationData);
  const konvaElements = [
  ];
  for (let i = 0; i < visualizationData.columns.length; i++) {
    const columnLine = drawColumnLine(visualizationData.columns[i].columnLine);
    const columnMethods = drawColumnMethods(visualizationData.columns[i].methods);
    const columnMethodArrows = drawColumnMethodArrows(visualizationData.columns[i].arrows);
    konvaElements.push(
      <ReactKonva.Group key={`data-group-for-column-${i}`}>
        { columnLine }
        { columnMethods }
        { columnMethodArrows }
      </ReactKonva.Group>
    );
  }
  const konvaLayer = [
    <ReactKonva.Layer key="class-overview-layer">
      { konvaElements }
    </ReactKonva.Layer>,
  ];
  return {
    primitiveShapes: konvaLayer,
    stageSize: stageSize,
  };
}
