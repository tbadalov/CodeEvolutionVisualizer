const React = require('react');
const ReactDOM = require('react-dom');
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
const { calculateLargestCommitSize } = require('./util');

let isMouseDown = false;
let isSelecting = false;
let isAutoScrolling = false;
let selectionClickStartX;
let selectionClickStartY;
let scrollInterval;
let currentX;
let currentY;
let tooltipTimeout;

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
  const tooltipItems = Object.keys(labelData.commitDetails)
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
      />
    ));
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
    this.disableTooltipTimer();
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
    this.mouseEnterStack = this.mouseEnterStack.bind(this)
    this.disableTooltipTimer = () => {};
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
    this.disableTooltipTimer();
    const {
      pageX,
      pageY,
    } = params;

    const tooltipTitle = params.tooltipTitle || this.state.tooltipTitle;
    const tooltipItems = params.tooltipItems || this.state.tooltipItems;
    const dummyContainer = document.createElement('div');
    document.body.appendChild(dummyContainer);
    ReactDOM.render(
      <Tooltip visible
        left={-9999}
        top={-9999}
        title={tooltipTitle}
        items={tooltipItems}
      />,
      dummyContainer
    );
    const tooltipWidth = dummyContainer.firstChild.offsetWidth;
    const tooltipHeight = dummyContainer.firstChild.offsetHeight;
    dummyContainer.remove();
    const tooltipLeft = pageX + tooltipWidth <= window.innerWidth ? pageX : pageX - tooltipWidth;
    const tooltipTop = pageY - tooltipHeight >= 0 ? pageY - tooltipHeight - constants.LABEL_HEIGHT : pageY + constants.LABEL_HEIGHT;
    this.setState({
      tooltipLeft,
      tooltipTop,
      tooltipTitle,
      tooltipItems,
    });
    const tooltipTimeout = setTimeout(() => {
      this.setState({
        tooltipVisible: true,
      });
    }, 700);

    this.disableTooltipTimer = () => {
      clearTimeout(tooltipTimeout);
      this.disableTooltipTimer = () => {};
    }
    return this.disableTooltipTimer;
  }

  onContainerScroll(scrollEvent) {
    requestAnimationFrame(() => {
      if (this.state.tooltipVisible) {
        this.hideTooltip();
      }
    });
  }

  changeDiagram(...args) {
    this.disableTooltipTimer();
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
    this.disableTooltipTimer();
    this.setState({
      cursorStyle: 'auto',
      tooltipVisible: false,
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
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  componentDidUpdate(prevProps, prevState) {
  }

  render() {
    this.barDataManager.updateUnderlyingData(this.props.data, this.props.classToColorMapping);
    this.barDataManager.showSourceCodeChanges(this.props.showSourceCodeChanges);
    this.barDataManager.showAssetChanges(this.props.showAssetChanges);
    this.barDataManager.enableAll();
    Object.keys(this.props.disabledClasses).forEach(className => this.barDataManager.disable(className));
    const dx = this.state.scrollLeft;
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
