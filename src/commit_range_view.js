const React = require('react');

const classNameColorMapping = {};

function drawRectangle(context, leftBottomCornerX, leftBottomCornerY, width, height, color) {
  let prevColor = context.fillStyle;
  context.fillStyle = color;
  context.fillRect(leftBottomCornerX, leftBottomCornerY, width, height);
  context.fillStyle = prevColor;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function drawBar(context, commit, order) {
  const leftBottomCornerX = 50 + order * (30 /* width */ + 2 /* margin */);
  let visualizedChangedLinesCount = 0;
  commit.changedClasses.forEach(changedClass => {
    if (!classNameColorMapping[changedClass.className]) {
      classNameColorMapping[changedClass.className] = { color: getRandomColor() };
    }
    const leftBottomCornerY = context.canvas.height - 30 /* vertical margin */ - commit.totalChangedLinesCount * 6 /* height */ + visualizedChangedLinesCount * 6;
    drawRectangle(context, leftBottomCornerX, leftBottomCornerY, 30 /* width */, changedClass.changedLinesCount * 6, classNameColorMapping[changedClass.className].color);
    visualizedChangedLinesCount += changedClass.changedLinesCount;
  });
}

function draw(context, commitsData) {
  commitsData.commits.forEach((commit, index) => {
    drawBar(context, commit, index);
  });
}

function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

function configCanvasSize(canvas) {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    configCanvasSize(canvas);
    loadData(this.props.url)
      .then(draw.bind(null, canvasContext))
      .catch((error) => console.log(error));
  }

  render() {
    return(
      <div className="diagram">
        <canvas
          className="diagram-canvas"
          ref={this.canvasRef}
          onClick={() => {
            this.props.changeDiagram(
              'classOverviewView',
              {
                className: 'BrewViewController',
                branch: 'master',
                startVersion: 5,
                endVersion: 20,
              }
            )
          }}
        />
      </div>
    );
  }
}

module.exports = CommitRangeView;
