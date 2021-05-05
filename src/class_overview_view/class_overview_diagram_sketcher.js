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
  console.log(columnMethods);
  const { columnIndex } = columnMethods.payload; 
  return (
    <ReactKonva.Group key={`methods-for-column-${columnIndex}`}>
      {
        columnMethods.methods.map((columnMethod, index) => {
          if (columnMethod.type === 'circle') {
            return (
              <ReactKonva.Circle key={`method-${index}-for-column-${columnIndex}`} {...columnMethod} />
            );
          }
          if (columnMethod.type === 'arc') {
            return (
              <ReactKonva.Arc key={`semi-changed-method-${index}-for-column-${columnIndex}`} {...columnMethod} />
            );
          }
        })
      }
    </ReactKonva.Group>
  );
}

function drawColumnMethodArrows(arrows) {
  return arrows.map((arrow, index) => (
    <ReactKonva.Group key={`arrow-${index}`}>
      <ReactKonva.Path {...arrow.arrowBody}/>
      <ReactKonva.Line {...arrow.arrowHead[0]}/>
      <ReactKonva.Line {...arrow.arrowHead[1]}/>
    </ReactKonva.Group>
  ));
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
  })).flatMap(rowElement => {
    const {
      circleRadius,
      circleX,
      circleY,
    } = methodPosition(columnIndex, rowElement.row);
    const result = [
      {
        type: 'circle',
        x: circleX,
        y: circleY,
        radius: circleRadius,
        fill: rowElement.status === 'new' ? 'blue' : (rowElement.status === 'changed' ? 'green' : 'gray'),
        payload: {},
      },
    ];
    if (rowElement.status === 'semi-changed') {
      result.push({
        type: 'arc',
        x: circleX,
        y: circleY,
        innerRadius: 0,
        outerRadius: circleRadius,
        angle: 180,
        rotation: 90,
        fill: 'green',
      });
    }
    return result;
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

// returns radians
function findAngle(sx, sy, ex, ey) {
  // make sx and sy at the zero point
  return Math.atan((ey - sy) / (ex - sx)) * 180.0 / Math.PI;
}

function buildArrowHead(columnIndex, fromRow, toRow, index) {
  const side = (fromRow+toRow+index) % 2 === 0 ? 1 : -1;
  const startRowPosition = methodPosition(columnIndex, fromRow);
  const endRowPosition = methodPosition(columnIndex, toRow);
  const startX = startRowPosition.circleX + startRowPosition.circleRadius * side;
  const endX = endRowPosition.circleX+endRowPosition.circleRadius * side;
  const {
    columnCenterX,
    columnWidth,
  } = columnPosition(columnIndex);
  const controlPointX = Math.min(columnCenterX+columnWidth/2.0, startX + Math.abs(endRowPosition.circleY - startRowPosition.circleY) / 5.0 * side);
  const angle = findAngle(endX, endRowPosition.circleY, controlPointX, (startRowPosition.circleY+endRowPosition.circleY)/2.0);
  return [
    {
      type: 'line',
      rotation: angle-45,
      x: endX,
      y: endRowPosition.circleY,
      points: [0, 0, 10*side, 0],
      stroke: 'black',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
    },
    {
      type: 'line',
      rotation: angle+45,
      x: endX,
      y: endRowPosition.circleY,
      points: [0, 0, 10*side, 0],
      stroke: 'black',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
    },
  ];
}

function buildArrow(columnIndex, fromRow, toRow, index) {
  const side = (fromRow+toRow+index) % 2 === 0 ? 1 : -1;
  const startRowPosition = methodPosition(columnIndex, fromRow);
  const endRowPosition = methodPosition(columnIndex, toRow);
  const startX = startRowPosition.circleX + startRowPosition.circleRadius * side;
  const endX = endRowPosition.circleX+endRowPosition.circleRadius * side;
  const {
    columnCenterX,
    columnWidth,
  } = columnPosition(columnIndex);
  const controlPointX = startX + Math.min(columnWidth/2.0, Math.abs(endRowPosition.circleY - startRowPosition.circleY) / 5.0) * side;
  let pts = {
    st: [startX, startRowPosition.circleY],
    ct: [
      controlPointX,
      (startRowPosition.circleY+endRowPosition.circleY) / 2.0
    ],
    en: [endX, endRowPosition.circleY]
  };
  const arrowHeadLine = buildArrowHead(columnIndex, fromRow, toRow, index);

  let pathStr = "M" + pts.st[0] + " " + pts.st[1] +
        "Q" + pts.ct[0] + " " + pts.ct[1] +
        " " + pts.en[0] + " " + pts.en[1];
  return {
    arrowBody: {
      type: 'path',
      data: pathStr,
      lineCap: 'round',
      strokeWidth: 5,
      stroke: 'black',
    },
    arrowHead: arrowHeadLine,
  };
}

function buildArrows(columnIndex, columnRow) {
  const arrows = [];
  Object.keys(columnRow).forEach(rowNumber => {
    arrows.push(
      ...columnRow[rowNumber].calls.map((toRow, index) => buildArrow(columnIndex, rowNumber, toRow, index))
    );
  });
  return arrows;
}

export function calculateStageHeight(totalMethodCount) {
  return constants.COLUMN_TOP_Y + constants.VERTICAL_MARGIN_FROM_TOP + totalMethodCount * constants.ROW_HEIGHT;
}

export function calculateStageWidth(totalCommitsCount) {
  return constants.METHOD_NAME_COLUMN_WIDTH + totalCommitsCount * constants.COLUMN_WIDTH;
}

function convertToVisualizationData(groupedData, params) {
  const {
    disabledBranches,
  } = params;
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
    const arrows = buildArrows(columnIndex, groupedData.columns[i].row);
    data.columns.push({
      columnLine,
      methods,
      arrows,
    });
  }
  return data;
}

export function draw(groupedData, params) {
  const {
    branchToColorMapping,
    disabledBranches,
    onMouseMove,
  } = params;
  const visualizationData = convertToVisualizationData(
    groupedData,
    {
      branchToColorMapping,
      disabledBranches,
    }
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
        { params.isDisplayingCallArrows ? columnMethodArrows : null}
      </ReactKonva.Group>
    );
  }
  const konvaLayer = [
    <ReactKonva.Layer key="class-overview-layer" onMouseMove={onMouseMove}>
      { konvaElements }
    </ReactKonva.Layer>,
  ];
  return {
    primitiveShapes: konvaLayer,
    stageSize: stageSize,
  };
}
