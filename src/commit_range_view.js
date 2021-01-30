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
let isMouseDown = false;
let isMouseMoving = false;

function mouseMoveListener(event, barDataManager, scrollContainer) {
  event.preventDefault();
  if (isMouseDown) {
    // range selection

  } else {
    // just hovering
    const foundBar = barDataManager.barByCoordinate(event.offsetX+scrollContainer.scrollLeft-Y_AXIS_WIDTH, event.offsetY);
    window.t = event.target;
    //console.log(event.clientX);
    console.log(event.offsetX+scrollContainer.scrollLeft);
    //console.log(scrollContainer.scrollLeft);
    console.log(foundBar);
    console.log(event);
    if (foundBar) {
      event.target.style.cursor = 'cursor-url';
    } else {
      event.target.style.cursor = 'auto';
    }
  }
}

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
}

function drawLabel(layer, label, onLabelClick) {
  const text = new Konva.Text({
    text: label.text,
    x: label.x,
    y: label.y,
    rotation: label.rotation,
  });
  layer.add(text);
  text.on('mouseenter', function () {
    stage.container().style.cursor = 'pointer';
  });
  text.on('mouseleave', function () {
    stage.container().style.cursor = 'auto';
  });
  text.on('click', function (e) {
    console.log(e);
    onLabelClick(e.target.attrs.text);
  });
}

function drawBar(layer, bar, onLabelClick) {
  const barGroup = new Konva.Group();
  const stackGroup = new Konva.Group();
  barGroup.add(stackGroup);
  layer.add(barGroup);
  for (let i = 0; i < bar.stack.length; i++) {
    const stack = bar.stack[i];
    drawStack(stackGroup, stack);
  }
  drawLabel(barGroup, bar.label, onLabelClick);
  let rect = null;
  stackGroup.on('mousemove', function (e) {
    console.log(e);
    if (rect) {
      rect.destroy();
    }
    /*rect = new Konva.Rect();
    rect.x(e.evt.layerX-Y_AXIS_WIDTH);
    rect.y(e.evt.layerY);
    rect.width(50);
    rect.height(50);
    rect.fill('#fff');
    barGroup.add(rect);
    barGroup.draw();*/
  });
  barGroup.on('mouseleave', function (e) {
    if (rect) {
      rect.destroy();
      rect = null;
    }
    barGroup.draw();
  });
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


function draw(stage, chartLayer, axisLayer, visualData, skipAxis, onLabelClick) {
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
    drawBar(chartLayer, bar, onLabelClick);
  });
  chartLayer.draw();
}

function repositionStage(barDataManager, stageData, containers, onLabelClick) {
  var dx = containers.scrollContainer.scrollLeft
  var dy = 0;
  stageData.chartLayer.destroyChildren();
  const visualData = barDataManager.dataFromRange(dx-PADDING, dx+containers.scrollContainer.clientWidth+PADDING);
  const axis = barDataManager.axisData();
  //console.log(visualData);
  stageData.stage.container().style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
  //console.log(bars);
  stageData.chartLayer.x(PADDING+Y_AXIS_WIDTH-dx);
  draw(stageData.stage, stageData.chartLayer, stageData.axisLayer, { axis: axis, bars: visualData.bars }, false, onLabelClick);
  //stage.y(-dy);
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
    this.containers = {
      diagramContainer,
      scrollContainer,
      largeContainer,
    };

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
    scrollContainer.addEventListener('scroll', () => repositionStage(this.barDataManager, this.stageData, this.containers));
    //largeContainer.addEventListener('mousemove', (event) => mouseMoveListener(event, this.barDataManager, this.containers.scrollContainer));
  }

  componentDidUpdate() {
    console.log("updating...")
    console.log(this.props);
    const diagramContainer = this.diagramContainerRef.current;
    const scrollContainer = this.scrollContainer.current;
    const largeContainer = this.largeContainer.current;
    this.barDataManager = new BarDataManager(this.props.data, this.props.classToColorMapping, largeContainer);
    Object.keys(this.props.disabledClasses).forEach(className => this.barDataManager.disable(className));

    const stage = this.stageData.stage;
    const chartLayer = this.stageData.chartLayer;
    const axisLayer = this.stageData.axisLayer;
    const stageWidth = this.barDataManager.calculateStageWidth();
    largeContainer.style.width = (stageWidth+Y_AXIS_WIDTH) + 'px';
    //height should be assigned after width because of appearing scrollbar
    largeContainer.style.height = scrollContainer.clientHeight + 'px';
    stage.height(this.barDataManager.calculateStageHeight());
    
    repositionStage(
      this.barDataManager,
      this.stageData,
      this.containers,
      (commit) => {
        this.props.onDiagramChange('callVolumeView', {label: commit, classToColorMapping: this.props.classToColorMapping});
      }
    );
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
