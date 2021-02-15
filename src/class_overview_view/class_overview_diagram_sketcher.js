const ClassOverviewDiagramPositioner = require('./class_overview_diagram_positioner');
const Konva = require('konva');
const constants = require('./constants');
const contants = require('./constants');

function drawColumnLine(layer, columnLine) {
  for (let i = 0; i < columnLine.length; i++) {
    layer.add(new Konva.Rect(columnLine[i]));
  }
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

function buildMethods(columnIndex, stageSize, columnRows, diagramPositioner) {
  console.log("build methods for column " + columnIndex);
  console.log(columnRows);
  return Object.keys(columnRows).map(rowNumber => ({
    ...columnRows[rowNumber],
    row: rowNumber,
  })).map(rowElement => {
    const {
      circleRadius,
      circleX,
      circleY,
    } = diagramPositioner.methodPosition(columnIndex, rowElement.row);
    console.log("circle");
    console.log(diagramPositioner.methodPosition(columnIndex, rowElement.row));
    return {
      type: 'circle',
      x: circleX,
      y: circleY,
      radius: circleRadius,
      fill: rowElement.status === 'new' ? 'blue' : (rowElement.status === 'changed' ? 'green' : 'gray'),
    };
  });
}

function buildColumnLine(columnIndex, stageSize, diagramPositioner) {
  const numberOfDashes = Math.ceil((stageSize.height - constants.COLUMN_TOP_Y - contants.DASH_HEIGHT) / (constants.DASH_HEIGHT+constants.DASH_VERTICAL_MARGIN)) + 1;
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

class ClassOverviewDiagramSketcher {
  constructor() {
    this.diagramPositioner = new ClassOverviewDiagramPositioner();
  }

  convertToVisualizationData(groupedData, stageSize) {
    const data = {
      columns: [],
    };
    for (let i = 0; i < groupedData.columns.length; i++) {
      const columnLine = buildColumnLine(i, stageSize, this.diagramPositioner);
      const methods = buildMethods(i, stageSize, groupedData.columns[i].row, this.diagramPositioner);
      const arrows = [];
      data.columns.push({
        columnLine,
        methods,
        arrows,
      });
    }
    return data;
  }

  draw(stage, groupedData) {
    console.log(groupedData);
    const visualizationData = this.convertToVisualizationData(
      groupedData,
      {
        height: stage.height(),
        width: stage.width(),
      }
    );
    console.log(visualizationData);
    const layer = new Konva.Layer();
    stage.add(layer);
    for (let i = 0; i < visualizationData.columns.length; i++) {
      drawColumnLine(layer, visualizationData.columns[i].columnLine);
      drawColumnMethods(layer, visualizationData.columns[i].methods);
      drawColumnMethodArrows(layer, visualizationData.columns[i].arrows);
    }
  }
}

module.exports = ClassOverviewDiagramSketcher;
