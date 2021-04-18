const React = require('react');
const ReactKonva = require('react-konva');
const BarDataManager = require('./bar_data_manager');
const Tooltip = require('../tooltip');
const TooltipCommitRangeItem = require('./tooltip_commit_range_item');
const CommitDetailTooltipItem = require('./commit_detail_tooltip_item');
const MouseSelectionArea = require('../mouse_selection_area');
const GeneralDiagram = require('../general_diagram');
const CommitRangeViewAxis = require('./chart_axis');
const BarChart = require('./bar_chart');
const constants = require('./constants');
const { largestCommitSize, calculateLargestCommitSize } = require('./util');

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




function disableTooltipTimer() {
  clearTimeout(tooltipTimeout);
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.selectionRectangleRef = React.createRef();
    this.rootContainerRef = React.createRef();
    this.barDataManager = new BarDataManager(this.props.data, this.props.classToColorMapping, this.largeContainerRef);
    this.clickCommit = this.clickCommit.bind(this);
    this.refreshDiagram = this.refreshDiagram.bind(this);
    this.onScrollContainerMouseMove = this.onScrollContainerMouseMove.bind(this);
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
        },
      },
      mouseSelectionAreaProps: {
        x: 0,
        y: 0,
        width: 0,
        isActive: false,
      },
      chartLayerProps: {
        scaleX: 1.0,
        scaleY: 1.0,
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

  clickCommit(e, labelPayload) {
    const commit = labelPayload.commitHash;
    const changedClassNames = labelPayload.stacks.map(stackPayload => stackPayload.changedClassName);
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
    const visualData = this.barDataManager.barsFromRange(dx, (dx+this.scrollContainerRef.current.clientWidth)/this.state.chartLayerProps.scaleX, {
      isClassDisabled: this.props.isClassDisabled,
    });
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
      const rawSubData = this.barDataManager.dataFromRange(Math.min(selectionStartX, currentX)-constants.BAR_LAYER_LEFT_MARGIN, Math.max(selectionStartX, currentX)-constants.BAR_LAYER_LEFT_MARGIN);
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
    this.forceUpdate();
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDownEventListener);
  }

  componentDidUpdate(prevProps, prevState) {
    console.log(this.props);
    const stageWidth = this.barDataManager.calculateStageWidth();
    const canvasWidth = stageWidth;
    this.largeContainerRef.current.style.width = canvasWidth + 'px';

  }

  render() {
    this.barDataManager.updateUnderlyingData(this.props.data, this.props.classToColorMapping);
    this.barDataManager.showSourceCodeChanges(this.props.showSourceCodeChanges);
    this.barDataManager.showAssetChanges(this.props.showAssetChanges);
    this.barDataManager.enableAll();
    Object.keys(this.props.disabledClasses).forEach(className => this.barDataManager.disable(className));
    const dx = this.state.scrollLeft;
    const commits = this.scrollContainerRef.current ? this.barDataManager.filteredData() : [];
    const largestCommitSize = calculateLargestCommitSize(commits, {
      isClassDisabled: this.props.disabledClasses,
    });
    return(
      <div ref={this.rootContainerRef}
        style={{width: '100%', height: '100%'}}
        onMouseMove={this.onScrollContainerMouseMove}
        onMouseDown={this.onScrollContainerMouseDown}
      >
        <CommitRangeViewAxis
          maxValue={largestCommitSize} />
        <BarChart
          width={this.rootContainerRef.current ? this.rootContainerRef.current.clientWidth - constants.Y_AXIS_WIDTH : 0 }
          height={this.rootContainerRef.current ? this.rootContainerRef.current.clientHeight : 0 }
          stackMouseEnterEventListener={mouseEnterStack.bind(this)}
          stackMouseMoveEventListener={mouseMoveStack.bind(this)}
          stackMouseLeaveEventListener={mouseLeaveStack.bind(this)}
          onLabelMousEnter={labelMouseEnter.bind(this)}
          onLabelMouseLeave={labelMouseLeave.bind(this)}
          onLabelClick={this.clickCommit}
          strokedStackCommitHash={this.state.strokedStackCommit}
          strokedStackClassName={this.state.strokedStackClassName}
          strokedStackBorderColor={this.state.strokedStackBorderColor}
          maxValue={largestCommitSize}
          chartLayerProps={this.state.chartLayerProps}
          onContainerScroll={this.onContainerScroll}
          isClassDisabled={this.props.disabledClasses}
          scrollContainerRef={this.scrollContainerRef}
          largeContainerRef={this.largeContainerRef}
          commits={commits}
        />
        <Tooltip
          visible={this.state.tooltipVisible}
          left={this.state.tooltipLeft}
          top={this.state.tooltipTop}
          title={this.state.tooltipTitle}
          items={this.state.tooltipItems} />
        <MouseSelectionArea {...this.state.mouseSelectionAreaProps}/>
      </div>
    );
  }
}

module.exports = CommitRangeView;
