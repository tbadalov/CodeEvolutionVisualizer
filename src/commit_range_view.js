const React = require('react');
const Konva = require('konva');

const BAR_WIDTH = 30;
const BAR_PADDING = 2;
const BAR_LAYER_LEFT_MARGIN = 40;
const Y_AXIS_WIDTH = 100;
const Y_AXIS_LINE_WIDTH = 6;
const LABEL_HEIGHT = 40;
const BAR_BOTTOM_MARGIN = LABEL_HEIGHT + 5;
const PADDING = 250;

const classNameColorMapping = {};
let lastDx = 0;
let lastTimestamp = Date.now();


function drawStack(layer, stack) {
  layer.add(new Konva.Rect({
    fill: stack.color,
    x: stack.x,
    y: stack.y,
    width: stack.width,
    height: stack.height,
    scaleY: stack.scaleY,
    scaleX: stack.scaleX,
  }));
  /*let prevColor = context.fillStyle;
  context.fillStyle = color;
  context.fillRect(leftBottomCornerX, leftBottomCornerY, width, height);
  context.fillStyle = prevColor;*/
}

function drawLabel(layer, label) {
  layer.add(new Konva.Text({
    text: label.text,
    x: label.x,
    y: label.y,
    rotation: label.rotation,
  }));
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function drawBar(layer, bar, order) {
  for (let i = 0; i < bar.stack.length; i++) {
    const stack = bar.stack[i];
    drawStack(layer, stack);
    drawLabel(layer, bar.label);
  }
}

function drawAxis(layer, axis) {
  layer.add(new Konva.Rect({
    x: 0,
    y: 0,
    width: Y_AXIS_WIDTH,
    height: layer.height(),
    fill: '#F0F0F0',
  }));

  layer.add(new Konva.Rect(axis.line));
  for (let i = 0; i < axis.segments.length; i++) {
    const segment = axis.segments[i];
    layer.add(new Konva.Rect(segment));
    layer.add(new Konva.Text({
      text: segment.label,
      x: segment.x - 20,
      y: segment.y,
    }));
  }
}

function convertToViewData(commitsData, stageHeight) {
  const data = {
    axis: {},
    bars: [],
  };

  const axisX = (Y_AXIS_WIDTH - Y_AXIS_LINE_WIDTH) / 2;
  const axisY = stageHeight;
  const axisWidth = Y_AXIS_LINE_WIDTH;
  const axisHeight = stageHeight;
  const segments = [];

  const largestCommitSize = commitsData.commits.reduce((max, commit) => Math.max(max, commit.totalChangedLinesCount), 0);
  for (let i = 0; i < 6; i++) {
    segments.push({
      x: axisX - 5,
      y: stageHeight - i * (stageHeight / 5) + 4 / 2,
      width: 10,
      height: 4,
      scaleY: -1,
      label: Math.floor(i * largestCommitSize / 5),
      full: '#000000',
    })
  }
  const heightPerLine = stageHeight / largestCommitSize;

  for (let i = 0; i < commitsData.commits.length; i++) {
    const commit = commitsData.commits[i];
    const barY = stageHeight;
    const barX = BAR_LAYER_LEFT_MARGIN + i * (BAR_PADDING + BAR_WIDTH);
    const barHeight = commit.totalChangedLinesCount * heightPerLine;
    const barWidth = BAR_WIDTH;
    const label = {
      text: commit.commitHash.substr(0, Math.min(commit.commitHash.length, 7)),
      rotation: -45,
      x: barX-15,
      y: barY + 35,
    }
    const stack = [];
    let currentStackHeight = 0;
    for (let j = 0; j < commit.changedClasses.length; j++) {
      const changedClass = commit.changedClasses[j];
      if (!classNameColorMapping[changedClass.className]) {
        classNameColorMapping[changedClass.className] = { color: getRandomColor() };
      }

      const stackX = barX;
      const stackY = barY - currentStackHeight;
      const stackHeight = changedClass.changedLinesCount * heightPerLine;
      const stackWidth = barWidth;
      const stackColor = classNameColorMapping[changedClass.className].color;
      stack.push({
        x: stackX,
        y: stackY,
        height: stackHeight,
        width: stackWidth,
        color: stackColor,
        scaleY: -1,
      });
      currentStackHeight += stackHeight;
    }
    data.axis = {
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
    data.bars.push({
      x: barX,
      y: barY,
      height: barHeight,
      width: barWidth,
      label: label,
      stack: stack,
    });
  }
  return data;
}

function draw(stage, chartLayer, axisLayer, visualData) {
  drawAxis(axisLayer, visualData.axis);
  axisLayer.draw();
  //window.layer = layer;
  window.stage = stage;
  window.Konva = Konva;
  visualData.bars.forEach((bar, index) => {
    drawBar(chartLayer, bar, index);
  });
  chartLayer.draw();
}

function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

function configCanvasSize(canvas) {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

function getCanvasSize(domElement) {
  return {
    width: domElement.parentElement.clientWidth,
    height: domElement.parentElement.clientHeight,
  };
}

function calcStageWidth(data) {
  return BAR_LAYER_LEFT_MARGIN + data.commits.length * (BAR_WIDTH + BAR_PADDING);
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.diagramContainerRef = React.createRef();
    this.scrollContainer = React.createRef();
    this.largeContainer = React.createRef();
  }

  componentDidMount() {
    const scaleBy = 1.02;
    const diagramContainer = this.diagramContainerRef.current;
    const scrollContainer = this.scrollContainer.current;
    const largeContainer = this.largeContainer.current;
    console.log("stage height = " + (scrollContainer.parentElement.clientHeight ));
    console.log(scrollContainer.offsetHeight);
    console.log(scrollContainer.clientHeight);
    const stage = new Konva.Stage({
      container: diagramContainer,
      width: scrollContainer.parentElement.clientWidth + PADDING * 2,
      height: scrollContainer.parentElement.clientHeight,
    });
    window.stage = stage;
    stage.x(-PADDING);
    const axisLayer = new Konva.Layer({
      x: PADDING,
    });
    const chartLayer = new Konva.Layer({
      x: Y_AXIS_WIDTH+PADDING,
    });
    stage.add(chartLayer);
    stage.add(axisLayer);
    loadData(this.props.url)
      .then(data => {
        return { commits: data.commits.concat(data.commits).concat(data.commits) };
      })
      .then(data => {
        console.log(data);
        const stageWidth = calcStageWidth(data);
        console.log("stageWidth=" + stageWidth);
        largeContainer.style.width = (stageWidth+Y_AXIS_WIDTH) + 'px';
        const scrollbarHeight = scrollContainer.offsetHeight - scrollContainer.clientHeight;
        console.log(scrollbarHeight);
        largeContainer.style.height = scrollContainer.clientHeight + 'px';
        stage.height(scrollContainer.clientHeight);
        return data;
      })
      .then(data => convertToViewData(data, stage.height()-BAR_BOTTOM_MARGIN))
      .then(data => {
        data.bars = data.bars.concat(data.bars).concat(data.bars);
        return data;
      })
      .then(draw.bind(null, stage, chartLayer, axisLayer))
      .catch((error) => console.log(error));

    function repositionStage() {
      const currentTimestamp = Date.now();
      lastTimestamp = currentTimestamp;
      var dx = scrollContainer.scrollLeft
      var dy = 0;
      stage.container().style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      stage.x(-PADDING);
      chartLayer.x(-dx + PADDING+Y_AXIS_WIDTH);
      //stage.y(-dy);
      chartLayer.draw();
    }
    /*stage.on('wheel', (e) => {
      console.log(e);
      if (Math.abs(e.evt.deltaX) > 0) {
        return;
      }
      e.evt.preventDefault();
      var oldScale = stage.scaleX();

      var pointer = stage.getPointerPosition();

      var mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      var newScale =
        e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      stage.scale({ x: newScale, y: newScale });

      var newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    });*/
    scrollContainer.addEventListener('scroll', repositionStage);
    repositionStage();
    
  }

  render() {
    return(
      <div
        className="scroll-container"
        ref={this.scrollContainer}
      >
        <div
          className="large-container"
          ref={this.largeContainer}
        >
          <div
            className="container"
            ref={this.diagramContainerRef}
          >
          </div>
        </div>
      </div>
    );
  }
}

module.exports = CommitRangeView;
