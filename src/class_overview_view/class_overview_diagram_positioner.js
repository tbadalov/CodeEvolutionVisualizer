const constants = require('./constants');

class ClassOverviewDiagramPositioner {
  columnPosition(columnIndex) {
    const columnStartY = constants.COLUMN_TOP_Y;
    const columnStartX = constants.METHOD_NAME_COLUMN_WIDTH + columnIndex * constants.COLUMN_WIDTH;
    const columnWidth = constants.COLUMN_WIDTH;
    const columnCenterX = columnStartX + constants.COLUMN_WIDTH / 2;
    return {
      columnCenterX,
      columnStartX,
      columnStartY,
      columnWidth,
    };
  }

  methodPosition(columnIndex, rowIndex) {
    const { columnCenterX } = this.columnPosition(columnIndex);
    const { rowCenterY } = this.rowPosition(columnIndex, rowIndex);
    const circleRadius = constants.METHOD_RADIUS;
    return {
      circleRadius,
      circleX: columnCenterX,
      circleY: rowCenterY,
    };
  }

  columnLineDashPosition(columnIndex, dashNumber) {
    const { columnCenterX } = this.columnPosition(columnIndex);
    const dashStartY = constants.COLUMN_TOP_Y + i * (constants.DASH_VERTICAL_MARGIN + constants.DASH_HEIGHT);
    const dashStartX = columnCenterX - constants.DASH_WIDTH/2;
    const dashHeight = constants.DASH_HEIGHT;
    const dashWidth = constants.DASH_WIDTH;
    return {
      dashHeight,
      dashStartX,
      dashStartY,
      dashWidth,
    };
  }

  rowPosition(columnIndex, rowIndex) {
    const rowStartY = constants.COLUMN_TOP_Y + rowIndex * constants.ROW_HEIGHT;
    const rowCenterY = rowStartY + constants.ROW_HEIGHT / 2;
    return {
      rowCenterY,
      rowStartY,
    };
  }
}