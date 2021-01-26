const React = require('react');
const Konva = require('konva');
const BarDataManager = require('./bar_data_manager');

const BAR_WIDTH = 30;
const BAR_PADDING = 2;
const BAR_LAYER_LEFT_MARGIN = 40;
const Y_AXIS_WIDTH = 100;
const Y_AXIS_LINE_WIDTH = 6;
const LABEL_HEIGHT = 40;
const BAR_BOTTOM_MARGIN = LABEL_HEIGHT + 5;
const PADDING = 250;
const EMPTY_SPACE_TOP_PERCENTAGE = 10;

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

function drawBar(layer, bar, order) {
  for (let i = 0; i < bar.stack.length; i++) {
    const stack = bar.stack[i];
    drawStack(layer, stack);
  }
  drawLabel(layer, bar.label);
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
      y: segment.y-6,
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
      label: Math.floor(i * (largestCommitSize + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * largestCommitSize)) / 5),
      fill: '#000000',
    })
  }
  const heightPerLine = stageHeight / (largestCommitSize + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * largestCommitSize));

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

function draw(stage, chartLayer, axisLayer, visualData, skipAxis) {
  if (!skipAxis) {
    drawAxis(axisLayer, visualData.axis);
    axisLayer.draw();
  }
  window.layer = chartLayer;
  window.stage = stage;
  window.Konva = Konva;
  visualData.bars.forEach((bar, index) => {
    //const barGroup = new Konva.Group();
    //chartLayer.add(barGroup);
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

function barsByRange(xStart, xEnd, visualData) {
  const startBarIndex = Math.floor(Math.max(0, (xStart - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
  const endBarIndex = Math.ceil(Math.max(0, (xEnd - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
  return visualData.bars.slice(startBarIndex, endBarIndex);
}

function barByCoordinate(x, y, visualData) {
  const barIndex = Math.floor(Math.max(0, (x - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.diagramContainerRef = React.createRef();
    this.scrollContainer = React.createRef();
    this.largeContainer = React.createRef();
  }

  componentDidMount() {
    console.log("mounting....")
    const diagramContainer = this.diagramContainerRef.current;
    const scrollContainer = this.scrollContainer.current;
    const largeContainer = this.largeContainer.current;

    const stage = new Konva.Stage({
      container: diagramContainer,
      width: scrollContainer.parentElement.clientWidth + PADDING * 2,
      height: scrollContainer.parentElement.clientHeight,
    });
    stage.x(-PADDING); // make a room for padding
    const axisLayer = new Konva.Layer({
      x: PADDING, // since stage starts counting from -PADDING, we need to start from PADDING, so that visually we start from 0 but have PADDING amount of empty space in the left
    });
    const chartLayer = new Konva.Layer({
      x: PADDING+Y_AXIS_WIDTH,
    });
    stage.add(chartLayer);
    stage.add(axisLayer);
    this.stageData = {
      stage,
      axisLayer,
      chartLayer,
    };
  }

  componentDidUpdate() {
    console.log("updating...")
    const diagramContainer = this.diagramContainerRef.current;
    const scrollContainer = this.scrollContainer.current;
    const largeContainer = this.largeContainer.current;
    this.barDataManager = new BarDataManager(this.props.data, largeContainer);

    const stage = this.stageData.stage;
    const chartLayer = this.stageData.chartLayer;
    const axisLayer = this.stageData.axisLayer;
    const stageWidth = this.barDataManager.calculateStageWidth();
    largeContainer.style.width = (stageWidth+Y_AXIS_WIDTH) + 'px';
    //height should be assigned after width because of appearing scrollbar
    largeContainer.style.height = scrollContainer.clientHeight + 'px';
    stage.height(this.barDataManager.calculateStageHeight());

    function repositionStage(barDataManager) {
      var dx = scrollContainer.scrollLeft
      var dy = 0;
      chartLayer.destroyChildren();
      const visualData = barDataManager.dataFromRange(dx-PADDING, dx+scrollContainer.clientWidth+PADDING);
      const axis = barDataManager.axisData();
      console.log(visualData);
      stage.container().style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      //console.log(bars);
      chartLayer.x(PADDING+Y_AXIS_WIDTH-dx);
      draw(stage, chartLayer, axisLayer, { axis: axis, bars: visualData.bars }, false);
      //stage.y(-dy);
      chartLayer.draw();
    }

    scrollContainer.addEventListener('scroll', () => repositionStage(this.barDataManager));
    repositionStage(this.barDataManager);
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
