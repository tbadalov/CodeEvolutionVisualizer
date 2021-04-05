const React = require('react');
const ReactKonva = require('react-konva');
const BarDataManager = require('./bar_data_manager');
const Tooltip = require('./tooltip');
const TooltipCommitRangeItem = require('./tooltip_commit_range_item');
const CommitDetailTooltipItem = require('./commit_detail_tooltip_item');
const MouseSelectionArea = require('./mouse_selection_area');
const PrimitiveDiagram = require('./primitive_diagram');
const GeneralDiagram = require('./general_diagram');
const CommitRangeViewAxis = require('./commit_range_view_axis');

const BAR_WIDTH = 30;
const BAR_PADDING = 2;
const SCALE_BY = 1.03;
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

function drawStack(stack, onMouseEnter, onMouseMove, onMouseLeave) {
  const rectProps = {
    ...stack,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
  };

  return <ReactKonva.Rect {...rectProps} />;
}

function drawLabel(label, onLabelClick, onLabelMouseEnter, onLabelMouseLeave) {
  const textProps = {
    text: label.text,
    x: label.x,
    y: label.y,
    rotation: label.rotation,
    onMouseEnter: onLabelMouseEnter,
    onMouseLeave: onLabelMouseLeave,
    onClick: function (e) {
      console.log(e);
      onLabelClick(label.payload.commitHash, label.payload.stacks.map(stackPayload => stackPayload.changedClassName));
    },
  };
  return <ReactKonva.Text {...textProps} />
}

function mouseEnterStack(event, payload) {
  restartTooltipTimer.call(this, payload, event.evt.pageX, event.evt.pageY);
  strokeStack.call(this, payload);
}

function strokeStack(payload) {
  this.setState({
    strokedStackCommit: payload.commitHash,
    strokedStackClassName: payload.changedClassName,
    strokedStackBorderColor: '#000000',
  });
}

function unstrokeStack() {
  this.setState({
    strokedStackCommit: undefined,
    strokedStackClassName: undefined,
  });
}

function labelMouseLeave() {
  this.setState({
    cursorStyle: 'auto',
  })
}

function labelMouseEnter(labelData) {
  return (function(event) {
    this.setState({
      cursorStyle: 'pointer',
    });
    disableTooltipTimer();
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
    unstrokeStack();
    disableTooltipTimer();
    this.setState({
      tooltipVisible: false,
    });
  }
}

function restartTooltipTimer(payload, mousePositionPageX, mousePositionPageY) {
  disableTooltipTimer();
  tooltipTimeout = setTimeout(() => {
    this.setState({
      tooltipLeft: mousePositionPageX + 5,
      tooltipTop: mousePositionPageY - 16,
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

function mouseMoveStack(event, payload) {
  restartTooltipTimer.call(this, payload, event.evt.pageX, event.evt.pageY);
}

function drawBar(bar, onLabelClick, stackMouseEnterEventListener, stackMouseMoveEventListener, stackMouseLeaveEventListener) {
  const reactKonvaStacks = [];
  for (let i = 0; i < bar.stack.length; i++) {
    const stack = bar.stack[i];
    if (stack.payload.commitHash === this.state.strokedStackCommit && stack.payload.changedClassName === this.state.strokedStackClassName) {
      stack.stroke = this.state.strokedStackBorderColor;
    }
    const drawnStack = drawStack(
      stack,
      (e) => stackMouseEnterEventListener(e, stack.payload),
      (e) => stackMouseMoveEventListener(e, stack.payload),
      stackMouseLeaveEventListener
    );
    reactKonvaStacks.push(drawnStack);
  }
  const reactKonvaText = drawLabel(bar.label, onLabelClick, labelMouseEnter.call(this, bar.label.payload), labelMouseLeave.bind(this));
  return (
    <ReactKonva.Group>
      { reactKonvaStacks }
      { reactKonvaText }
    </ReactKonva.Group>
  )
}

function drawAxis(axis, height) {
  const yAxisBackgroundColoringRectProps = {
    x: 0,
    y: 0,
    width: Y_AXIS_WIDTH,
    height: height,
    fill: '#F0F0F0',
  };

  return (
    <ReactKonva.Group>
      <ReactKonva.Rect {...yAxisBackgroundColoringRectProps} />
      <ReactKonva.Rect {...axis.line} />
      { axis.segments.map((segment, index) => <ReactKonva.Rect {...segment} key={index} />) }
      {
        axis.segments.map(segment => ({
          text: segment.label,
          x: segment.x-20,
          y: segment.y-6,
        })).map((segment, index) => <ReactKonva.Text {...segment} key={'text'+index} />)
      }
    </ReactKonva.Group>
  )
}

function onKeyDownEventListener(e) {
  let scaleBy = 1.0;
  switch(e.key) {
    case '-':
      scaleBy = 1.0 / SCALE_BY;
      break;
    case '+':
      scaleBy = SCALE_BY;
      break;
    default:
      return;
  }
  scaleChartLayer.call(this, scaleBy);
}

function onStageWheelEventListener(e) {
  if (e.evt.deltaX !== 0 || e.evt.deltaY === 0) {
    return;
  }
  const scaleBy = e.evt.deltaY > 0 ? SCALE_BY : 1.0 / SCALE_BY;
  scaleChartLayer.call(this, scaleBy);
}

function scaleChartLayer(scaleBy) {
  var oldScale = this.state.chartLayerProps.scaleX;
  var newScale = oldScale * scaleBy;
  this.setState({
    chartLayerProps: {
      ...this.state.chartLayerProps,
      scaleX: newScale,
    },
  });
  this.refreshDiagram();
}


function draw(visualData) {
  const chartLayerElements = [];
  const stackMouseEnterEventListener = mouseEnterStack.bind(this);
  const stackMouseMoveEventListener = mouseMoveStack.bind(this);
  const stackMouseLeaveEventListener = mouseLeaveStack.bind(this, unstrokeStack.bind(this));
  visualData.bars.forEach((bar, index) => {
    chartLayerElements.push(drawBar.call(this, bar, this.clickCommit, stackMouseEnterEventListener, stackMouseMoveEventListener, stackMouseLeaveEventListener));
  });
  return [
    <ReactKonva.Layer {...this.state.chartLayerProps}>
      { chartLayerElements }
    </ReactKonva.Layer>,
  ];
}

function disableTooltipTimer() {
  clearTimeout(tooltipTimeout);
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.selectionRectangleRef = React.createRef();
    this.barDataManager = new BarDataManager(this.props.data, this.props.classToColorMapping, this.largeContainerRef);
    this.clickCommit = this.clickCommit.bind(this);
    this.refreshDiagram = this.refreshDiagram.bind(this);
    this.onScrollContainerMouseMove = this.onScrollContainerMouseMove.bind(this);
    this.onStageWheelEventListener = onStageWheelEventListener.bind(this);
    this.onContainerScroll = this.onContainerScroll.bind(this);
    this.convertDataToPrimitiveShapes = this.convertDataToPrimitiveShapes.bind(this);
    this.onScrollContainerMouseDown = this.onScrollContainerMouseDown.bind(this);
    this.onKeyDownEventListener = onKeyDownEventListener.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.state = {
      tooltipVisible: false,
      tooltipLeft: 0,
      tooltipTop: 0,
      strokedStackCommit: undefined,
      strokedStackClassName: undefined,
      strokedStackBorderColor: '#000000',
      cursorStyle: 'auto',
      scrollLeft: 0,
      largeContainerHeight: 0,
      primitiveDiagramProps: {
        stageProps: {
          width: 0,
          height: 0,
          x: -PADDING,
          onWheel: this.onStageWheelEventListener,
        },
      },
      mouseSelectionAreaProps: {
        x: 0,
        y: 0,
        width: 0,
        isActive: false,
      },
      chartLayerProps: {
        x: PADDING,
        scaleX: 1.0,
        scaleY: 1.0,
      },
      axisLayerProps: {
        x: PADDING,
      },
    };
  }

  onContainerScroll(scrollEvent) {
    const scrollContainer = scrollEvent.target;
    const scrollLeft = scrollContainer.scrollLeft;
    // we always want to re-render when scrolling
    if (this.state.tooltipVisible) {
      this.hideTooltip();
    } else {
      this.setState({
        scrollLeft: scrollLeft,
        chartLayerProps: {
          ...this.state.chartLayerProps,
          x: PADDING - scrollLeft,
        },
      });
    }
  }

  convertDataToPrimitiveShapes() {
    if (this.scrollContainerRef.current) {
      return this.refreshDiagram();
    }
    return null;
  }

  changeDiagram(...args) {
    disableTooltipTimer();
    this.props.onDiagramChange(...args);
  }

  clickCommit(commit, changedClassNames) {
    this.changeDiagram(
      'callVolumeView',
      {
        selectedCommit: commit,
        selectedClassNames: changedClassNames,
      }
    );
  }

  ensureTooltipCloses(mousePositionPageX, mousePositionPageY) {
    if (this.state.tooltipVisible && mousePositionPageX - this.state.tooltipLeft < -20 && mousePositionPageY - this.state.tooltipTop < -20) {
      this.hideTooltip();
    }
  }

  adjustMouseSelectionAreaSize(scrollContainerOffsetLeft, scrollContainerScrollLeft, mousePositionPageX) {
    currentX = mousePositionPageX - scrollContainerOffsetLeft + scrollContainerScrollLeft;
    const selectionRectangleLeftX = Math.min(selectionStartX, currentX);
    const selectionWidth = Math.max(selectionStartX, currentX) - selectionRectangleLeftX;
    this.setState({
      mouseSelectionAreaProps: {
        ...this.state.mouseSelectionAreaProps,
        x: selectionRectangleLeftX,
        width: selectionWidth,
        isActive: true,
      },
    });
  }

  onScrollContainerMouseMove(mouseMoveEvent) {
    this.ensureTooltipCloses(mouseMoveEvent.pageX, mouseMoveEvent.pageY);
    const scrollContainer = mouseMoveEvent.target;
    const { offsetLeft, scrollLeft, clientWidth } = scrollContainer;
    if (!isMouseDown) {
      return;
    }
    isSelecting = true;
    mouseMoveEvent.preventDefault();
    this.adjustMouseSelectionAreaSize(offsetLeft, scrollLeft, mouseMoveEvent.pageX);
    let scrollDelta = 0;
    let viewportPositionX = currentX - scrollLeft;
    const SCROLL_AREA_WIDTH = 30;
    const MAX_SCROLL_SPEED = 30; // pixels per interval
    if (viewportPositionX > clientWidth - SCROLL_AREA_WIDTH) {
      scrollDelta = (Math.min(viewportPositionX, clientWidth) - (clientWidth - SCROLL_AREA_WIDTH)) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
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

  onScrollContainerMouseDown(mouseDownEvent) {
    const { offsetLeft, offsetTop, scrollTop } = mouseDownEvent.target;
    isMouseDown = true;
    selectionStartX = mouseDownEvent.pageX - offsetLeft + this.state.scrollLeft;
    selectionStartY = mouseDownEvent.pageY - offsetTop + scrollTop;
  }

  hideTooltip() {
    disableTooltipTimer();
    this.setState({
      cursorStyle: 'auto',
      tooltipVisible: false,
    });
  }

  refreshDiagram() {
    const dx = this.state.scrollLeft;
    const dy = 0;
    const visualData = this.barDataManager.barsFromRange(dx-PADDING, (dx+this.scrollContainerRef.current.clientWidth+PADDING)/this.state.chartLayerProps.scaleX);
    return draw.call(this, { bars: visualData.bars });
  }

  onMouseUp(e) {
    isMouseDown = false;
    if (isSelecting) {
      this.setState({
        mouseSelectionAreaProps: {
          ...this.state.mouseSelectionAreaProps,
          isActive: false,
        },
      });
      clearInterval(scrollInterval);
      scrollInterval = null;
      isSelecting = false;
      isAutoScrolling = false;
      const rawSubData = this.barDataManager.dataFromRange(Math.min(selectionStartX, currentX)-Y_AXIS_WIDTH-BAR_LAYER_LEFT_MARGIN, Math.max(selectionStartX, currentX)-Y_AXIS_WIDTH-BAR_LAYER_LEFT_MARGIN);
      const commitHashes = rawSubData.map(commit => commit.commitHash);
      console.log(commitHashes);
      console.log("first:" + commitHashes[0]);
      this.changeDiagram(
        'classOverviewView',
        {
          startCommit: commitHashes[0],
          endCommit: commitHashes[commitHashes.length-1],
        }
      );
    }
  }

  componentDidMount() {
    console.log("mounting....")
    document.addEventListener('keydown', this.onKeyDownEventListener);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDownEventListener);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.data === prevProps.data && this.props.disabledClasses === prevProps.disabledClasses && this.state.primitiveDiagramProps.stageProps.width === prevState.primitiveDiagramProps.stageProps.width && this.state.largeContainerHeight === prevState.largeContainerHeight) {
      return;
    }
    console.log(this.props);
    const stageWidth = this.barDataManager.calculateStageWidth();
    const canvasWidth = stageWidth;
    this.largeContainerRef.current.style.width = canvasWidth + 'px';
    /*//height should be assigned after width because of appearing scrollbar
    const canvasHeight = this.scrollContainerRef.current.clientHeight; // todo: should I use this or calculateStageHeight()?
    this.largeContainerRef.current.style.height = canvasHeight + 'px';*/
    this.setState({
      primitiveDiagramProps: {
        ...this.state.primitiveDiagramProps,
        stageProps: {
          ...this.state.primitiveDiagramProps.stageProps,
          width: canvasWidth,
          height: this.barDataManager.calculateStageHeight(),
        },
      },
    });
  }

  render() {
    this.barDataManager.updateUnderlyingData(this.props.data, this.props.classToColorMapping);
    this.barDataManager.showSourceCodeChanges(this.props.showSourceCodeChanges);
    this.barDataManager.showAssetChanges(this.props.showAssetChanges);
    this.barDataManager.enableAll();
    Object.keys(this.props.disabledClasses).forEach(className => this.barDataManager.disable(className));
    return(
      <React.Fragment>
        <CommitRangeViewAxis
          maxValue={this.barDataManager.largestCommitSize} />
        <GeneralDiagram {...this.state}
          rootStyle={{
            position: 'absolute',
            left: Y_AXIS_WIDTH + 'px',
          }}
          scrollContainerRef={this.scrollContainerRef}
          largeContainerRef={this.largeContainerRef}
          onContainerScroll={this.onContainerScroll}
          onContainerMouseMove={this.onScrollContainerMouseMove}
          onContainerMouseDown={this.onScrollContainerMouseDown}
          onDraw={this.convertDataToPrimitiveShapes}>
          <Tooltip
            visible={this.state.tooltipVisible}
            left={this.state.tooltipLeft}
            top={this.state.tooltipTop}
            title={this.state.tooltipTitle}
            items={this.state.tooltipItems} />
          <MouseSelectionArea {...this.state.mouseSelectionAreaProps}/>
        </GeneralDiagram>
      </React.Fragment>
    );
  }
}

module.exports = CommitRangeView;
