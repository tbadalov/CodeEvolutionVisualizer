const React = require('react');
const ReactDOM = require('react-dom');
const ReactKonva = require('react-konva');
const BarDataManager = require('./bar_data_manager');
const TooltipCommitRangeItem = require('./tooltip_commit_range_item');
const CommitDetailTooltipItem = require('./commit_detail_tooltip_item');
const MouseSelectionArea = require('../mouse_selection_area');
const GeneralDiagram = require('../general_diagram');
const CommitRangeViewAxis = require('./chart_axis');
const BarChart = require('./bar_chart');
const constants = require('./constants');
const {
  SCROLL_AREA_WIDTH,
  MAX_SCROLL_SPEED,
} = constants;
const { calculateLargestCommitSize } = require('./util');
const DelayedTooltip = require('../ui_elements/delayed_tooltip');
const TooltipWithGithubButton = require('../ui_elements/tooltip_with_github_button');
const { commitTooltipItems } = require('../utils');

let isMouseDown = false;
let isSelecting = false;
let isAutoScrolling = false;
let selectionClickStartX;
let selectionClickStartY;
let scrollInterval;
let currentX;
let currentY;

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

function labelMouseEnter(event, labelData) {
  this.setState({
    cursorStyle: 'pointer',
  });
  const tooltipItems = commitTooltipItems(labelData, {
    classToColorMapping: this.props.classToColorMapping,
  });
  this.showTooltip({
    pageX: event.evt.pageX,
    pageY: event.evt.pageY,
    tooltipTitle: labelData.commitHash,
    tooltipItems,
  });
}

function mouseLeaveStack(unstrokeStack, event) {
  if (Math.abs(this.state.tooltipLeft - (event.evt.pageX)) > 4) { // mouse out of tooltip
    unstrokeStack();
    this.setState({
      tooltipVisible: false,
    });
  }
}

class CommitRangeView extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.selectionRectangleRef = React.createRef();
    this.rootContainerRef = React.createRef();
    this.barDataManager = new BarDataManager(this.props.data, this.props.classToColorMapping);
    this.clickCommit = this.clickCommit.bind(this);
    this.onScrollContainerMouseMove = this.onScrollContainerMouseMove.bind(this);
    this.onContainerScroll = this.onContainerScroll.bind(this);
    this.onScrollContainerMouseDown = this.onScrollContainerMouseDown.bind(this);
    this.mouseMoveStack = this.mouseMoveStack.bind(this);
    this.mouseEnterStack = this.mouseEnterStack.bind(this);
    this.changeDiagram = this.changeDiagram.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.state = {
      tooltipVisible: false,
      tooltipLeft: 0,
      tooltipTop: 0,
      tooltipItems: [],
      tooltipTitle: "",
      strokedStackCommit: undefined,
      strokedStackClassName: undefined,
      strokedStackBorderColor: '#000000',
      cursorStyle: 'auto',
      scrollLeft: 0,
      largeContainerHeight: 0,
      mouseSelectionAreaProps: {
        x: 0,
        y: 0,
        width: 0,
        isActive: false,
      },
    };
  }

  mousePosition(mouseEvent) {
    return {
      x: mouseEvent.pageX - this.props.offsetLeft - constants.Y_AXIS_WIDTH + this.scrollContainerRef.current.scrollLeft,
      y: mouseEvent.pageY,
    };
  }

  mouseEnterStack(event, payload) {
    const tooltipItems = [
      <TooltipCommitRangeItem
        key='1'
        markerColor={this.props.classToColorMapping[payload.changedClassName]}
        className={payload.changedClassName}
        amount={`${payload.changedLinesCount} line${payload.changedLinesCount > 1 ? 's were' : ' was'} changed (${payload.changedLinesCountPercentage.toFixed(2)}%)`}
      />
    ];
    this.showTooltip({
      pageX: event.evt.pageX,
      pageY: event.evt.pageY,
      tooltipTitle: payload.commitHash,
      tooltipItems,
    });
    strokeStack.call(this, payload);
  }

  restartTooltipTimer(mousePositionPageX, mousePositionPageY) {
    this.showTooltip({
      pageX: mousePositionPageX,
      pageY: mousePositionPageY,
    });
  }

  mouseMoveStack(event, payload) {
    this.restartTooltipTimer(event.evt.pageX, event.evt.pageY);
  }

  showTooltip(params) {
    const {
      pageX,
      pageY,
    } = params;

    const tooltipTitle = params.tooltipTitle || this.state.tooltipTitle;
    const tooltipItems = params.tooltipItems || this.state.tooltipItems;
    this.setState({
      tooltipLeft: pageX,
      tooltipTop: pageY,
      tooltipVisible: true,
      delay: 700,
      tooltipOffset: 20,
      tooltipTitle,
      tooltipItems,
    });
  }

  onContainerScroll(scrollEvent) {
    requestAnimationFrame(() => {
      if (this.state.tooltipVisible) {
        this.hideTooltip();
      }
    });
  }

  changeDiagram(...args) {
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

  adjustMouseSelectionAreaSize(currentX) {
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
    if (!isMouseDown) {
      return;
    }
    this.ensureTooltipCloses(mouseMoveEvent.pageX, mouseMoveEvent.pageY);
    isSelecting = true;
    currentX = this.mousePosition(mouseMoveEvent).x;
    let viewportPositionX = currentX - this.scrollContainerRef.current.scrollLeft;
    isAutoScrolling = (viewportPositionX > this.scrollContainerRef.current.clientWidth - SCROLL_AREA_WIDTH) || (viewportPositionX < SCROLL_AREA_WIDTH && selectionStartX + this.scrollContainerRef.current.scrollLeft >= SCROLL_AREA_WIDTH);
    this.adjustMouseSelectionAreaSize(currentX);
  }

  setAutoScroll() {
    scrollInterval = setInterval(() => {
      let scrollDelta = 0;
      const scrollContainer = this.scrollContainerRef.current;
      let viewportPositionX = currentX - this.scrollContainerRef.current.scrollLeft;
      if (viewportPositionX > scrollContainer.clientWidth - SCROLL_AREA_WIDTH) {
        scrollDelta = (Math.min(viewportPositionX, scrollContainer.clientWidth) - (scrollContainer.clientWidth - SCROLL_AREA_WIDTH)) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
      } else if (viewportPositionX < SCROLL_AREA_WIDTH) {
        scrollDelta = (Math.max(0, viewportPositionX) - SCROLL_AREA_WIDTH) / SCROLL_AREA_WIDTH * MAX_SCROLL_SPEED;
      }
      if (currentX+scrollDelta > this.scrollContainerRef.current.scrollWidth) {
        scrollDelta = 0;
      }
      currentX += scrollDelta;
      scrollContainer.scrollBy(scrollDelta, 0);
      this.adjustMouseSelectionAreaSize(currentX);
    }, 10);
  }

  componentDidUpdate() {
    if (isAutoScrolling) {
      if (!scrollInterval) {
        this.setAutoScroll();
      }
    } else {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
  }

  onScrollContainerMouseDown(mouseDownEvent) {
    isMouseDown = true;
    const {x, y} = this.mousePosition(mouseDownEvent);
    selectionStartX = x;
    selectionStartY = y;
  }

  hideTooltip() {
    this.setState({
      cursorStyle: 'auto',
      tooltipVisible: false,
      delay: 0,
    });
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
      isSelecting = false;
      isAutoScrolling = false;
      const selectFromX = Math.min(selectionStartX, currentX);
      const selectToX = Math.max(selectionStartX, currentX);
      if (selectToX > constants.BAR_LAYER_LEFT_MARGIN ) {
        this.setState({
          selectFromX,
          selectToX,
        });
      }
    }
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  render() {
    this.barDataManager.updateUnderlyingData(this.props.data, this.props.classToColorMapping);
    this.barDataManager.showSourceCodeChanges(this.props.showSourceCodeChanges);
    this.barDataManager.showAssetChanges(this.props.showAssetChanges);
    this.barDataManager.enableAll();
    Object.keys(this.props.disabledClasses).forEach(className => this.barDataManager.disable(className));
    const commits = this.scrollContainerRef.current ? this.barDataManager.filteredData({isClassDisabled: this.props.disabledClasses}) : [];
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
          stackMouseEnterEventListener={this.mouseEnterStack}
          stackMouseMoveEventListener={this.mouseMoveStack}
          stackMouseLeaveEventListener={mouseLeaveStack.bind(this, unstrokeStack.bind(this))}
          onLabelMouseEnter={labelMouseEnter.bind(this)}
          onLabelMouseLeave={labelMouseLeave.bind(this)}
          onLabelClick={this.clickCommit}
          strokedStackCommitHash={this.state.strokedStackCommit}
          strokedStackClassName={this.state.strokedStackClassName}
          strokedStackBorderColor={this.state.strokedStackBorderColor}
          maxValue={largestCommitSize}
          onContainerScroll={this.onContainerScroll}
          isClassDisabled={this.props.disabledClasses}
          scrollContainerRef={this.scrollContainerRef}
          cursorStyle={this.state.cursorStyle}
          selectFromX={this.state.selectFromX}
          selectToX={this.state.selectToX}
          isSelecting={isSelecting}
          changeDiagram={this.changeDiagram}
          applicationName={this.props.applicationName}
          repositoryUrl={this.props.repositoryUrl}
          commits={commits}
        >
          <DelayedTooltip
            delay={this.state.delay}
            tooltipClass={TooltipWithGithubButton}
            visible={this.state.tooltipVisible}
            left={this.state.tooltipLeft}
            offset={this.state.tooltipOffset}
            top={this.state.tooltipTop}
            commitHash={this.state.tooltipTitle}
            repositoryUrl={this.props.repositoryUrl}
            items={this.state.tooltipItems} />
          <MouseSelectionArea {...this.state.mouseSelectionAreaProps}/>
        </BarChart>
      </div>
    );
  }
}

module.exports = CommitRangeView;
