const React = require('react');
const Konva = require('konva');
const BarDataManager = require('./bar_data_manager');
const selectionRectangleStyle = require('./css/selection-rectangle.css');

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
let isAutoScrolling = false;
let selectionClickStartX;
let selectionClickStartY;
let scrollInterval;
let currentX;
let currentY;


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
    this.selectionRectangleRef = React.createRef();
  }

  componentDidMount() {
    console.log("mounting....")
    const diagramContainer = this.diagramContainerRef.current;
    const scrollContainer = this.scrollContainer.current;
    const largeContainer = this.largeContainer.current;
    const selectionRectangle = this.selectionRectangleRef.current;
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
    scrollContainer.addEventListener('scroll', () => repositionStage(this.barDataManager, this.stageData, this.containers, (commit) => {
      this.props.onDiagramChange('callVolumeView', {label: commit, classToColorMapping: this.props.classToColorMapping});
    }));
    
    scrollContainer.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      selectionStartX = e.pageX - scrollContainer.offsetLeft + scrollContainer.scrollLeft;
      selectionStartY = e.pageY - scrollContainer.offsetTop + scrollContainer.scrollTop;
      console.log(selectionStartX, selectionStartY);
      console.log(e);
    });
    scrollContainer.addEventListener('mousemove', (e) => {
      if (!isMouseDown) {
        return;
      }
      isMouseMoving = true;
      console.log(scrollContainer);
      e.preventDefault();
      console.log("nya");
      currentX = e.pageX - scrollContainer.offsetLeft + scrollContainer.scrollLeft;
      currentY = e.pageY - scrollContainer.offsetTop + scrollContainer.scrollTop;
      console.log("currentX=" + currentX);
      console.log("currentY=" + currentY);
      let selectionRectangleLeftX = Math.min(selectionStartX, currentX);
      let selectionRectangleTopY = Math.min(selectionStartY, currentY);
      let selectionWidth = Math.max(selectionStartX, currentX) - selectionRectangleLeftX;
      let selectionHeight = Math.max(selectionStartY, currentY) - selectionRectangleTopY;
      selectionRectangle.style.display = 'block';
      selectionRectangle.style.width = selectionWidth + 'px';
      selectionRectangle.style.height = (scrollContainer.clientHeight-2) + 'px'; // -2 for each border: top and bottom
      selectionRectangle.style.left = selectionRectangleLeftX + 'px';
      //selectionRectangle.style.top = selectionRectangleTopY + 'px';
      let scrollDelta = 0;
      let viewportPositionX = currentX - scrollContainer.scrollLeft;
      let viewportPositionY = currentY - scrollContainer.scrollTop;
      const SCROLL_AREA_WIDTH = 30;
      const MAX_SCROLL_SPEED = 30; // pixels per interval
      if (viewportPositionX > scrollContainer.clientWidth - SCROLL_AREA_WIDTH) {
        scrollDelta = (Math.min(viewportPositionX, scrollContainer.clientWidth) - (scrollContainer.clientWidth - SCROLL_AREA_WIDTH)) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
        isAutoScrolling = true;
      } else if (viewportPositionX < SCROLL_AREA_WIDTH) {
        scrollDelta = (Math.max(0, viewportPositionX) - SCROLL_AREA_WIDTH) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
        isAutoScrolling = true;
      }
      currentX += scrollDelta;
      scrollContainer.scrollBy(scrollDelta, 0);
      if (isAutoScrolling && !scrollInterval) {
        scrollInterval = setInterval(() => {
          let scrollDelta = 0;
          let viewportPositionX = currentX - scrollContainer.scrollLeft;
          console.log("viewPortPositionX = " + viewportPositionX);
          console.log("scroll width=" + scrollContainer.clientWidth);
          console.log("scroll left = " + scrollContainer.scrollLeft);
          let viewportPositionY = currentY - scrollContainer.scrollTop;
          if (viewportPositionX > scrollContainer.clientWidth - SCROLL_AREA_WIDTH) {
            console.log((Math.min(viewportPositionX, scrollContainer.clientWidth) - (scrollContainer.clientWidth - SCROLL_AREA_WIDTH)));
            scrollDelta = (Math.min(viewportPositionX, scrollContainer.clientWidth) - (scrollContainer.clientWidth - SCROLL_AREA_WIDTH)) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
          } else if (viewportPositionX < SCROLL_AREA_WIDTH) {
            scrollDelta = (Math.max(0, viewportPositionX) - SCROLL_AREA_WIDTH) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
          }
          currentX += scrollDelta;
          console.log("scrollDelta=" + scrollDelta);
          scrollContainer.scrollBy(scrollDelta, 0);
        }, 10);
      }
    });
    document.addEventListener('mouseup', () => {
      selectionRectangle.style.display = 'none';
      isMouseDown = false;
      if (isMouseMoving) {
        clearInterval(scrollInterval);
        scrollInterval = null;
        isMouseMoving = false;
        isAutoScrolling = false;
      }
      const bars = this.barDataManager.dataFromRange(Math.min(selectionStartX, currentX)-Y_AXIS_WIDTH-BAR_LAYER_LEFT_MARGIN, Math.max(selectionStartX, currentX)-Y_AXIS_WIDTH-BAR_LAYER_LEFT_MARGIN);
      const commits = bars.bars.map(bar => bar.label.text);
      console.log(commits);
      this.props.onDiagramChange(
        'classOverviewView',
        {
          classToColorMapping: this.props.classToColorMapping,
          commits: commits,
        }
      );
    });
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
          <div
            className="selection-rectangle"
            ref={this.selectionRectangleRef}
          >
          </div>
        </div>
      </div>
    );
  }
}

module.exports = CommitRangeView;
