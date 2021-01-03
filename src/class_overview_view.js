const React = require('react');

const horizontalLineStartX = 100;
const horizontalLineEndX = 800;
const horizontalLineY = 100;
const methodRadius = 30;
const columnLineWidth = 3;
const columnLineStartX = horizontalLineStartX + methodRadius + 120 + (columnLineWidth / 2) + 1;
const columnMargin = 200;
const rowMargin = 100;
const firstRowX = horizontalLineStartX - 80;
const firstRowY = horizontalLineY + 100;

const groupBy = function(array, key) {
  return array.reduce(
    (result, element) => {
      (result[element[key]] = result[element[key]] || []).push(element);
      return result;
    },
    {}
  );
};

function findGetParameter(parameterName) {
  var result = null, tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

const orderedCommits = function(data) {
  const foundCommit = {};
  return data.reduce(
    (result, element) => {
      if (foundCommit[element.commit]) {
        return result;
      }
      result.push(element.commit);
      foundCommit[element.commit] = true;
      return result;
    },
    []
  )
};

// returns radians
function findAngle(sx, sy, ex, ey) {
  // make sx and sy at the zero point
  return Math.atan((ey - sy) / (ex - sx));
}

function drawParabola(ctx, startX, startY, cpX, cpY, endX, endY) {
  ctx.beginPath();
  ctx.fillStyle = "rgba(55, 217, 56,1)";
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(cpX, cpY, endX, endY);
  ctx.stroke(); 
}

function drawArrowhead(ctx, locx, locy, angle, sizex, sizey) {
  var hx = sizex / 2;
  var hy = sizey / 2;
  ctx.translate((locx ), (locy));
  ctx.rotate(angle);
  ctx.translate(-hx,-hy);

  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(0,1*sizey);    
  ctx.lineTo(1*sizex,1*hy);
  ctx.closePath();
  ctx.fill();
  ctx.translate(hx,hy);
  ctx.rotate(-angle);
  ctx.translate(-(locx ), -(locy));
  ctx.fill();
}

function drawArrow(ctx, column, fromRow, toRow, side) {
  var sx = calcColumnX(column) + methodRadius * side + Math.abs(calcRowY(toRow) - calcRowY(fromRow)) / 5.0 * side;
  var sy = calcRowY(fromRow) + Math.abs(calcRowY(toRow) - calcRowY(fromRow)) / 2.0;
  var ex = calcColumnX(column) + (methodRadius + 10) * side;
  var ey = calcRowY(toRow);
  var startX = calcColumnX(column) + methodRadius * side;
  var startY = calcRowY(fromRow);
  drawParabola(ctx, startX, startY, sx, sy, ex, ey);
  var ang = findAngle(sx, sy, ex, ey);
  ctx.fillRect(ex, ey, 2, 2);
  drawArrowhead(ctx, ex, ey, ang, 12, 12);
}

function convertDatabaseDataToViewData(records) {
  const data = {method: {}, methodByCommit: {}, row: {}, column: {}};
  let recordsGroupedByCommitHash = groupBy(records, 'commit');
  for (let commit in recordsGroupedByCommitHash) {
    if (data.methodByCommit[commit] === undefined) {
      data.methodByCommit[commit] = {};
    }
    for (let i = 0; i < recordsGroupedByCommitHash[commit].length; i++ ) {
      let record = recordsGroupedByCommitHash[commit][i];
      const methodName = record.method;
      if (data.methodByCommit[commit][methodName] === undefined) {
        console.log("Encountered " + commit + " method " + methodName);
        data.methodByCommit[commit][methodName] = { access: 'unknown', status: record.status, called_methods: record.calls };
      }
      if (data.method[methodName] === undefined) {
        console.log("Encountered method " + methodName + " in " + commit);
        data.method[methodName] = { first_time_appeared: record.version, first_time_appeared_commit: commit };
      } else if (data.method[methodName].first_time_appeared > record.version) {
        data.method[methodName].first_time_appeared = record.version;
        data.method[methodName].first_time_appeared_commit = commit;
      }
    }
  }
  console.log(data);
  let rowCount = 0;
  for (let methodName in data.method) {
    rowCount++;
    data.row[rowCount] = { label: methodName };
    data.method[methodName].mappedRow = rowCount;
  }
  let columnCount = 0;
  for (let commit in recordsGroupedByCommitHash) {
    columnCount++;
    data.column[columnCount] = { arrow: [], row: {} };
    for (let row in data.row) {
      console.log(commit + " row" + row);
      console.log(data.row[row]);
      if (data.methodByCommit[commit][data.row[row].label] === undefined) {
        console.log("Not found " + data.row[row].label + " at " + commit);
        data.column[columnCount].row[row] = { skip: true };
        continue;
      }
      called_method_numbers = data.methodByCommit[commit][data.row[row].label].called_methods.map(called_method => data.method[called_method].mappedRow);
      called_method_numbers.forEach(method_number => data.column[columnCount].arrow.push({from: row, to: method_number}));
      if (data.method[data.row[row].label].canShow || commit === data.method[data.row[row].label].first_time_appeared_commit) {
        data.column[columnCount].row[row] = {
          label: data.row[row].label,
          status: data.methodByCommit[commit][data.row[row].label].status,
          calls: called_method_numbers
        }
        data.method[data.row[row].label].canShow = true;
      } else {
        data.column[columnCount].row[row] = { skip: true };
      }

    }
  }
  return data;
}

function calcColumnX(columnNumber) {
  return columnLineStartX + (methodRadius+columnMargin) * (columnNumber-1);
}

function calcRowY(rowNumber) {
  return firstRowY + (methodRadius+rowMargin) * (rowNumber-1);
}

function drawColumnLine(ctx, columnNumber) {
  const columnX = calcColumnX(columnNumber);
  const columnY = horizontalLineY - 20;
  let currentX = columnX;
  let currentY = columnY;
  ctx.lineWidth = columnLineWidth;
  for (var i = 0; i < 30; i++ ) {
    ctx.moveTo(currentX, currentY);    // Move the pen to (30, 50)
    ctx.lineTo(currentX, currentY+10);  // Draw a line to (150, 100)
    ctx.stroke();
    currentY = currentY + 10 + 20;
  }
}

function configCanvasSize(canvas) {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

function draw(context, data) {
  const visualizationData = convertDatabaseDataToViewData(data);
  let rowX = firstRowX;
  context.font = '14px serif';
  for (var row in visualizationData['row']) {
    rowY = calcRowY(row);
    context.fillText(visualizationData['row'][row]['label'], rowX, rowY);
  }
  for (var column in visualizationData['column']) {
    drawColumnLine(context, column);
    rowX = calcColumnX(column);
    for (var row in visualizationData['column'][column]['row']) {
      if (visualizationData['column'][column]['row'][row]['skip']) {
        continue;
      }
      console.log('row' + row);
      methodName = visualizationData['column'][column]['row'][row]['label'];
      accessType = visualizationData['method'][methodName]['access'];
      status = visualizationData['column'][column]['row'][row]['status'];
      rowY = calcRowY(row);
      context.beginPath();
      let circle = new Path2D();  // <<< Declaration
      circle.arc(rowX, rowY, methodRadius, 0, 2 * Math.PI, false);
      context.fillStyle = status === 'same' ? 'gray' : status === 'changed' ? 'pink' : accessType === 'public' ? 'green' : accessType === 'private' ? 'red' : 'blue';
      context.fill(circle); //   <<< pass circle to context
      context.stroke();

      //draw arrows
      for (const callRow of visualizationData['column'][column]['row'][row]['calls']) {
        console.log('callRow: ' + callRow);
        const side = (callRow % 2 == 0 ? 1 : -1);
        drawArrow(context, column, row, callRow, side);
      }
    }
  }
}

function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

class ClassOverviewView extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    configCanvasSize(canvas);
    loadData(this.props.url + '?className=' + this.props.props.className + '&branch=' + this.props.props.branch + '&startVersion=' + this.props.props.startVersion + "&endVersion=" + this.props.props.endVersion)
      .then(draw.bind(null, canvasContext))
      .catch((error) => console.log(error));
  }

  render() {
    return(
      <div className="diagram">
        <canvas className="diagram-canvas" ref={this.canvasRef} />
      </div>
    );
  }
}

module.exports = ClassOverviewView;
