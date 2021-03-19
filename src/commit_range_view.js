const React = require('react');
const Konva = require('konva');
const BarDataManager = require('./bar_data_manager');
const Tooltip = require('./tooltip');
const TooltipCommitRangeItem = require('./tooltip_commit_range_item');
const CommitDetailTooltipItem = require('./commit_detail_tooltip_item');
const MouseSelectionArea = require('./mouse_selection_area');

const BAR_WIDTH = 30;
const BAR_PADDING = 2;
const SCALE_BY = 1.02;
const BAR_LAYER_LEFT_MARGIN = 40;
const Y_AXIS_WIDTH = 100;
const Y_AXIS_LINE_WIDTH = 6;
const LABEL_HEIGHT = 40;
const BAR_BOTTOM_MARGIN = LABEL_HEIGHT + 5;
const PADDING = 250;
const EMPTY_SPACE_TOP_PERCENTAGE = 10;
let isMouseDown = false;
let isSelecting = false;
let isAutoScrolling = false;
let selectionClickStartX;
let selectionClickStartY;
let scrollInterval;
let currentX;
let currentY;
let tooltipTimeout;
let stageWheelListenerAdded = false;


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
  const konvaStack = new Konva.Rect({
    fill: stack.color,
    x: stack.x,
    y: stack.y,
    width: stack.width,
    height: stack.height,
    scaleY: stack.scaleY,
    scaleX: stack.scaleX,
  });
  layer.add(konvaStack);
  return konvaStack;
}

function drawLabel(layer, label, onLabelClick, onLabelMouseEnter, onLabelMouseLeave) {
  const text = new Konva.Text({
    text: label.text,
    x: label.x,
    y: label.y,
    rotation: label.rotation,
  });
  layer.add(text);
  text.on('mouseenter', onLabelMouseEnter);
  text.on('mouseleave', onLabelMouseLeave);
  text.on('click', function (e) {
    console.log(e);
    onLabelClick(e.target.attrs.text);
  });
}

function strokeStack(layer, event) {
  const stack = event.currentTarget;
  stack.strokeEnabled(true);
  stack.stroke('black');
  layer.draw();
}

function unstrokeStack(layer, event) {
  const stack = event.currentTarget;
  stack.strokeEnabled(false);
  layer.draw();
}

function labelMouseLeave() {
  this.stageData.stage.container().style.cursor = 'auto';
}

function labelMouseEnter(labelData) {
  return (function(event) {
    this.stageData.stage.container().style.cursor = 'pointer';
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      console.log(labelData);
      this.setState({
        tooltipLeft: event.evt.pageX - 10,
        tooltipTop: event.evt.pageY - (Object.keys(labelData.commitDetails).length + labelData.stacks.length + 1) * 25 - 25,
        tooltipVisible: true,
        tooltipTitle: labelData.commitHash,
        tooltipItems: Object.keys(labelData.commitDetails)
          .map((commitDetail, index) => <CommitDetailTooltipItem
            key={index}
            detailName={commitDetail}
            detailValue={labelData.commitDetails[commitDetail]}
          />)
          .concat(
            labelData.stacks.map((stackPayload, index) => <TooltipCommitRangeItem
              key={index + Object.keys(labelData.commitDetails).length}
              markerColor={this.props.classToColorMapping[stackPayload.changedClassName]}
              className={stackPayload.changedClassName}
              amount={`${stackPayload.changedLinesCount} line${stackPayload.changedLinesCount > 1 ? 's were' : ' was'} changed (${stackPayload.changedLinesCountPercentage.toFixed(2)}%)`}
            />)
          ),
      });
    }, 700);
  }).bind(this);
}

function mouseLeaveStack(unstrokeStack, event) {
  if (Math.abs(this.state.tooltipLeft - (event.evt.pageX)) > 4) { // mouse out of tooltip
    unstrokeStack(event);
    clearTimeout(tooltipTimeout);
    this.setState({
      tooltipVisible: false,
    });
  }
}

function mouseMoveStack(event, payload) {
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    this.setState({
      tooltipLeft: event.evt.pageX + 5,
      tooltipTop: event.evt.pageY - 16,
      tooltipVisible: true,
      tooltipTitle: payload.commitHash,
      tooltipItems: [
        <TooltipCommitRangeItem
          key='1'
          markerColor={this.props.classToColorMapping[payload.changedClassName]}
          className={payload.changedClassName}
          amount={`${payload.changedLinesCount} line${payload.changedLinesCount > 1 ? 's were' : ' was'} changed (${payload.changedLinesCountPercentage.toFixed(2)}%)`}
        />
      ]
    });
  }, 700);
}

function drawBar(layer, bar, onLabelClick, stackMouseEnterEventListener, stackMouseMoveEventListener, stackMouseLeaveEventListener) {
  const barGroup = new Konva.Group();
  const stackGroup = new Konva.Group();
  barGroup.add(stackGroup);
  layer.add(barGroup);
  for (let i = 0; i < bar.stack.length; i++) {
    const stack = bar.stack[i];
    const drawnStack = drawStack(stackGroup, stack);
    drawnStack.on('mouseenter', stackMouseEnterEventListener);
    drawnStack.on('mousemove', (e) => stackMouseMoveEventListener(e, stack.payload));
    drawnStack.on('mouseleave', stackMouseLeaveEventListener);
  }
  drawLabel(barGroup, bar.label, onLabelClick, labelMouseEnter.call(this, bar.label.payload), labelMouseLeave.bind(this));
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

function onKeyDownEventListener(chartLayer, e) {
  let scaleBy = 1.0;
  switch(e.key) {
    case '-':
      scaleBy = 1.0 / SCALE_BY;
      break;
    case '+':
      scaleBy = SCALE_BY;
      break;
  }
  scaleChartLayer.call(this, chartLayer, scaleBy);
}

function onStageWheelEventListener(chartLayer, e) {
  if (e.evt.deltaX !== 0 || e.evt.deltaY === 0) {
    return;
  }
  const scaleBy = e.evt.deltaY > 0 ? SCALE_BY : 1.0 / SCALE_BY;
  scaleChartLayer.call(this, chartLayer, scaleBy);
}

function scaleChartLayer(chartLayer, scaleBy) {
  var oldScale = chartLayer.scaleX();
  var newScale = oldScale * scaleBy;
  chartLayer.scale({ x: newScale });
  this.refreshDiagram();
}


function draw(stage, chartLayer, axisLayer, visualData, skipAxis, onLabelClick) {
  if (!skipAxis) {
    drawAxis(axisLayer, visualData.axis);
    axisLayer.draw();
  }
  window.layer = chartLayer;
  window.stage = stage;
  window.Konva = Konva;
  // To save memory, we create only one instance of listeners and pass it to each stack instead of creating one per each stack
  // Enabling and disabling stroke needs redrawing of the layer, otherwise some thin surrounding stroke is left, so we pass chart layer too
  const stackMouseEnterEventListener = strokeStack.bind(null, chartLayer);
  const stackMouseMoveEventListener = mouseMoveStack.bind(this);
  const stackMouseLeaveEventListener = mouseLeaveStack.bind(this, unstrokeStack.bind(this, chartLayer));
  visualData.bars.forEach((bar, index) => {
    //const barGroup = new Konva.Group();
    //chartLayer.add(barGroup);
    drawBar.call(this, chartLayer, bar, onLabelClick, stackMouseEnterEventListener, stackMouseMoveEventListener, stackMouseLeaveEventListener);
  });
  chartLayer.draw();
  if (!stageWheelListenerAdded) {
    document.addEventListener('keydown', onKeyDownEventListener.bind(this, chartLayer));
    stage.on('wheel', onStageWheelEventListener.bind(this, chartLayer));
    stageWheelListenerAdded = true;
  }
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.diagramContainerRef = React.createRef();
    this.scrollContainer = React.createRef();
    this.largeContainer = React.createRef();
    this.selectionRectangleRef = React.createRef();
    this.clickCommit = this.clickCommit.bind(this);
    this.refreshDiagram = this.refreshDiagram.bind(this);
    this.onScrollContainerMouseMove = this.onScrollContainerMouseMove.bind(this);
    this.state = {
      width: 0,
      height: 0,
      tooltipVisible: false,
      tooltipLeft: 0,
      tooltipTop: 0,
      mouseSelectionAreaProps: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        isActive: false,
      },
    }
  }

  clickCommit(commit) {
    this.props.onDiagramChange(
      'callVolumeView',
      {
        label: commit,
        classToColorMapping: this.props.classToColorMapping,
      }
    );
  }

  ensureTooltipCloses(mousePositionPageX, mousePositionPageY) {
    if (this.state.tooltipVisible && mousePositionPageX - this.state.tooltipLeft < -20 && mousePositionPageY - this.state.tooltipTop < -20) {
      this.hideTooltip();
    }
  }

  adjustMouseSelectionAreaSize(mousePositionPageX) {
    const scrollContainer = this.scrollContainer.current;
    currentX = mousePositionPageX - scrollContainer.offsetLeft + scrollContainer.scrollLeft;
    const selectionRectangleLeftX = Math.min(selectionStartX, currentX);
    const selectionWidth = Math.max(selectionStartX, currentX) - selectionRectangleLeftX;
    this.setState({
      mouseSelectionAreaProps: {
        ...this.state.mouseSelectionAreaProps,
        x: selectionRectangleLeftX,
        width: selectionWidth,
        height: this.state.height,
        isActive: true,
      },
    });
  }

  onScrollContainerMouseMove(e) {
    this.ensureTooltipCloses(e.pageX, e.pageY);
    const scrollContainer = this.scrollContainer.current;
    if (!isMouseDown) {
      return;
    }
    isSelecting = true;
    e.preventDefault();
    this.adjustMouseSelectionAreaSize(e.pageX);
    let scrollDelta = 0;
    let viewportPositionX = currentX - scrollContainer.scrollLeft;
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
  }

  hideTooltip() {
    clearTimeout(tooltipTimeout);
    this.stageData.stage.container().style.cursor = 'auto';
    this.setState({
      tooltipVisible: false,
    });
  }

  refreshDiagram() {
    if (this.state.tooltipVisible) {
      this.hideTooltip();
    }
    const dx = this.scrollContainer.current.scrollLeft;
    const dy = 0;
    this.stageData.chartLayer.destroyChildren();
    const visualData = this.barDataManager.barsFromRange(dx-PADDING, (dx+this.scrollContainer.current.clientWidth+PADDING)/this.stageData.stage.scaleX());
    const axis = this.barDataManager.axisData();
    this.stageData.stage.container().style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    this.stageData.chartLayer.x(PADDING+Y_AXIS_WIDTH-dx);
    draw.call(this, this.stageData.stage, this.stageData.chartLayer, this.stageData.axisLayer, { axis: axis, bars: visualData.bars }, false, this.clickCommit);
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
      scale: 1,
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
    scrollContainer.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      selectionStartX = e.pageX - scrollContainer.offsetLeft + scrollContainer.scrollLeft;
      selectionStartY = e.pageY - scrollContainer.offsetTop + scrollContainer.scrollTop;
      console.log(selectionStartX, selectionStartY);
      console.log(e);
    });
    document.addEventListener('mouseup', () => {
      this.setState({
        mouseSelectionAreaProps: {
          ...this.state.mouseSelectionAreaProps,
          isActive: false,
        },
      });
      isMouseDown = false;
      if (isSelecting) {
        clearInterval(scrollInterval);
        scrollInterval = null;
        isSelecting = false;
        isAutoScrolling = false;
        const rawSubData = this.barDataManager.dataFromRange(Math.min(selectionStartX, currentX)-Y_AXIS_WIDTH-BAR_LAYER_LEFT_MARGIN, Math.max(selectionStartX, currentX)-Y_AXIS_WIDTH-BAR_LAYER_LEFT_MARGIN);
        const commitHashes = rawSubData.map(commit => commit.commitHash);
        console.log(commitHashes);
        console.log("first:" + commitHashes[0]);
        this.props.onDiagramChange(
          'classOverviewView',
          {
            classToColorMapping: this.props.classToColorMapping,
            startCommit: commitHashes[0],
            endCommit: commitHashes[commitHashes.length-1],
          }
        );
      }
    });
  }

  componentDidUpdate(prevProps) {
    console.log("updating...")
    if (this.props.data === prevProps.data && this.props.disabledClasses === prevProps.disabledClasses) {
      return;
    }
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
    const canvasWidth = stageWidth + Y_AXIS_WIDTH;
    largeContainer.style.width = canvasWidth + 'px';
    //height should be assigned after width because of appearing scrollbar
    const canvasHeight = scrollContainer.clientHeight;
    largeContainer.style.height = canvasHeight + 'px';
    stage.height(this.barDataManager.calculateStageHeight());
    this.refreshDiagram();
    this.setState({
      width: canvasWidth,
      height: canvasHeight,
    });
  }

  render() {
    return(
      <div>
        <Tooltip
          visible={this.state.tooltipVisible}
          left={this.state.tooltipLeft}
          top={this.state.tooltipTop}
          title={this.state.tooltipTitle}
          items={this.state.tooltipItems}
        />
        <div
          className="scroll-container"
          onScroll={this.refreshDiagram}
          onMouseMove={this.onScrollContainerMouseMove}
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
          <MouseSelectionArea {...this.state.mouseSelectionAreaProps}/>
        </div>
      </div>
    );
  }
}

module.exports = CommitRangeView;
