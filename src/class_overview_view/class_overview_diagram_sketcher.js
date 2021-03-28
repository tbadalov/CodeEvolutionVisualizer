const ClassOverviewDiagramPositioner = require('./class_overview_diagram_positioner');
const Konva = require('konva');
const constants = require('./constants');
const contants = require('./constants');

function drawColumnLine(layer, columnLine) {
  for (let i = 0; i < columnLine.length; i++) {
    layer.add(new Konva.Rect(columnLine[i]));
  }
}

function drawColumnTitle(layer, columnTitle) {
  const group = new Konva.Group();
  group.add(new Konva.Rect(columnTitle.frame))
  group.add(new Konva.Text(columnTitle.text));
  layer.add(group);
  return group;
}

function drawColumnMethods(layer, columnMethods) {
  for (let i = 0; i < columnMethods.length; i++) {
    layer.add(new Konva.Circle(columnMethods[i]));
  }
}

function drawColumnMethodArrows(layer, arrows) {
  for (let i = 0; i < arrows.length; i++) {
    //layer.add(new Konva.Circle(columnMethods[i]));
  }
}

function drawMethodLegend(layer, methodNames) {
  methodNames.forEach(methodName => {
    layer.add(new Konva.Text(methodName));
  });
}

function buildColumnTitle(columnIndex, columnData, diagramPositioner, branchToColorMapping) {
  const title = columnData.commitHash;
  const columnTitleText = title.substr(0, 8);
  const columnTitlePosition = diagramPositioner.columnTitlePosition(columnIndex, columnTitleText);
  columnTitlePosition.frame = {
    type: 'rect',
    fill: '#ffffff',
    stroke: branchToColorMapping[columnData.branchName] || '#000000',
    strokeWidth: 3,
    ...columnTitlePosition.frame,
  };
  columnTitlePosition.text = {
    type: 'text',
    text: columnTitleText,
    fill: '#000000',
    ...columnTitlePosition.text,
  };
  return columnTitlePosition;
}

function buildMethodLegend(allMethodNames, diagramPositioner) {
  return allMethodNames.map((methodName, index) => {
    const methodNamePosition = diagramPositioner.methodNamePosition(index);
    return {
      type: 'text',
      ...methodNamePosition,
      fill: '#000000',
      text: methodName,
    };
  });
}

function buildColumnMethods(columnIndex, columnRows, diagramPositioner) {
  return Object.keys(columnRows).map(rowNumber => ({
    ...columnRows[rowNumber],
    row: rowNumber,
  })).map(rowElement => {
    const {
      circleRadius,
      circleX,
      circleY,
    } = diagramPositioner.methodPosition(columnIndex, rowElement.row);
    return {
      type: 'circle',
      x: circleX,
      y: circleY,
      radius: circleRadius,
      fill: rowElement.status === 'new' ? 'blue' : (rowElement.status === 'changed' ? 'green' : 'gray'),
    };
  });
}

function buildColumnLine(columnIndex, totalRowCount, diagramPositioner) {
  const numberOfDashes = (totalRowCount * constants.ROW_HEIGHT) / (constants.DASH_HEIGHT+constants.DASH_VERTICAL_MARGIN);
  const dashes = [];
  for (let i = 0; i < numberOfDashes; i++) {
    const {
      dashStartY,
      dashStartX,
      dashHeight,
      dashWidth,
    } = diagramPositioner.columnLineDashPosition(columnIndex, i);
    dashes.push({
      type: 'rect',
      x: dashStartX,
      y: dashStartY,
      height: dashHeight,
      width: dashWidth,
      fill: '#000000',
    });
  }
  return dashes;
}

function calculateStageHeight(totalMethodCount) {
  return constants.COLUMN_TOP_Y + constants.VERTICAL_MARGIN_FROM_TOP + totalMethodCount * constants.ROW_HEIGHT;
}

function calculateStageWidth(totalCommitsCount) {
  return constants.METHOD_NAME_COLUMN_WIDTH + totalCommitsCount * constants.COLUMN_WIDTH;
}

class ClassOverviewDiagramSketcher {
  constructor() {
    this.diagramPositioner = new ClassOverviewDiagramPositioner();
  }

  convertToVisualizationData(groupedData, branchToColorMapping) {
    const data = {
      columns: [],
    };
    data.methodLegend = buildMethodLegend(Object.keys(groupedData.methodNameToRowNumberMapping), this.diagramPositioner);
    for (let i = 0; i < groupedData.columns.length; i++) {
      const columnLine = buildColumnLine(i, data.methodLegend.length, this.diagramPositioner);
      const columnTitle = buildColumnTitle(i, groupedData.columns[i], this.diagramPositioner, branchToColorMapping);
      const methods = buildColumnMethods(i, groupedData.columns[i].row, this.diagramPositioner);
      console.log(methods);
      const arrows = [];
      data.columns.push({
        columnLine,
        columnTitle,
        methods,
        arrows,
      });
    }
    return data;
  }

  draw(stage, groupedData, onCommitClick, branchToColorMapping) {
    const visualizationData = this.convertToVisualizationData(
      groupedData,
      branchToColorMapping
    );
    const stageSize = {
      width: calculateStageWidth(visualizationData.columns.length),
      height: calculateStageHeight(visualizationData.methodLegend.length),
    };
    console.log(visualizationData);
    const layer = new Konva.Layer();
    stage.add(layer);
    drawMethodLegend(layer, visualizationData.methodLegend);
    for (let i = 0; i < visualizationData.columns.length; i++) {
      drawColumnLine(layer, visualizationData.columns[i].columnLine);
      const columnTitle = drawColumnTitle(layer, visualizationData.columns[i].columnTitle);
      columnTitle.on('mouseenter', function () {
        stage.container().style.cursor = 'pointer';
      });
      columnTitle.on('mouseleave', function () {
        stage.container().style.cursor = 'auto';
      });
      columnTitle.on('click', () => onCommitClick(groupedData.columns[i].commitHash));
      drawColumnMethods(layer, visualizationData.columns[i].methods);
      drawColumnMethodArrows(layer, visualizationData.columns[i].arrows);
    }
    return stageSize;
  }
}

module.exports = ClassOverviewDiagramSketcher;
