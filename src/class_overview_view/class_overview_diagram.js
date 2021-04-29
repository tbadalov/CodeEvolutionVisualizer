const React = require('react');
const { draw } = require('./class_overview_diagram_sketcher');
const GeneralDiagram = require('../general_diagram');
const ClassOverviewMethodLegend = require('./class_overview_method_legend');
const ClassOverviewColumnTitles = require('./class_overview_column_titles');
const constants = require('./constants');
const { columnTotalTitleFramHeight, columnTotalTitleFrameHeight } = require('./class_overview_diagram_positioner');
const ClassOverviewDataConverter = require('./data_converter');
const { commitTooltipItems } = require('../utils');
const DelayedTooltip = require('../ui_elements/delayed_tooltip');
const TooltipWithGithubButton = require('../ui_elements/tooltip_with_github_button');

class ClassOverviewDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.columnTitlesScrollContainerRef = React.createRef();
    this.methodLegendScrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.onScroll = this.onScroll.bind(this);
    this.labelMouseEnter = this.labelMouseEnter.bind(this);
    this.onTitleMouseLeave = this.onTitleMouseLeave.bind(this);
    this.onDiagramMouseMove = this.onDiagramMouseMove.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.state = {
      rawData: { commits: {} },
      tooltipVisible: false,
      tooltipLeft: 0,
      tooltipTop: 0,
      cursorStyle: 'auto',
      primitiveDiagramProps: {
        stageProps: {
          width: 0,
          height: 0,
          onWheel: this.onStageWheelEventListener,
        },
      },
    };
  }

  onScroll(e) {
    const { scrollLeft, scrollTop } = e.target;
    this.columnTitlesScrollContainerRef.current.scrollTo(scrollLeft, scrollTop);
    this.methodLegendScrollContainerRef.current.scrollTo(scrollLeft, scrollTop);
    this.hideTooltip();
  }

  onDiagramMouseMove(e) {
    this.ensureTooltipCloses(e.pageX, e.pageY);
  }

  ensureTooltipCloses(mousePositionPageX, mousePositionPageY) {
    if (this.state.tooltipVisible && mousePositionPageX - this.state.tooltipLeft < -20 || Math.abs(mousePositionPageY - this.state.tooltipTop) > 450) {
      this.hideTooltip();
    }
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

  onTitleMouseLeave(e) {
    this.ensureTooltipCloses(e.pageX, e.pageY);
  }

  hideTooltip(e, payload) {
    this.setState({
      tooltipVisible: false,
      delay: 0,
    })
  }

  labelMouseEnter(event, titlePayload) {
    const labelData = titlePayload.labelData;
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

  componentDidUpdate(prevProps) {
    if (this.props.rawData !== prevProps.rawData || this.props.branchToColorMapping !== prevProps.branchToColorMapping || this.props.disabledBranches !== prevProps.disabledBranches || this.props.collapseSameCommits !== prevProps.collapseSameCommits) {
      let rawData = {
        ...this.props.rawData,
      };
      rawData.columns = rawData.columns.filter(columnData => !this.props.disabledBranches[columnData.branchName]);
      rawData = this.props.collapseSameCommits ? new ClassOverviewDataConverter().combineColumnsWithTheSameState(rawData) : rawData;
      const drawResult = draw(
          rawData,
          (commit) => {
            this.props.onDiagramChange('callVolumeView', {label: commit, classToColorMapping: this.props.classToColorMapping});
          },
          this.props.branchToColorMapping,
          this.props.disabledBranches,
          this.onDiagramMouseEnter
      );

      this.largeContainerRef.current.style.width = drawResult.stageSize.width + 'px';
      this.largeContainerRef.current.style.height = drawResult.stageSize.height + 'px';
      this.convertDataToPrimitiveShapes = () => drawResult.primitiveShapes;
      this.setState({
          processedData: rawData,
          primitiveDiagramProps: {
              ...this.state.primitiveDiagramProps,
              stageProps: {
                  ...this.state.primitiveDiagramProps.stageProps,
                  ...drawResult.stageSize,
              },
          },
      })
    }
  }

  render() {
    const methodNameToRowNumberMapping = this.state.processedData ? this.state.processedData.methodNameToRowNumberMapping : {};
    const methods = Object.entries(methodNameToRowNumberMapping)
      .sort(([, methodRow1], [, methodRow2]) => methodRow1 - methodRow2)
      .map(([methodName]) => ({
        methodName,
      }));
    const columnTitles = (this.state.processedData ? this.state.processedData.columns : [])
      .filter(columnTitle => !this.props.disabledBranches[columnTitle.branchName])
    return(
      <React.Fragment>
        <ClassOverviewMethodLegend
          scrollContainerRef={this.methodLegendScrollContainerRef}
          methods={methods} />
        <GeneralDiagram
          {...this.state}
          rootStyle={{
            position: 'absolute',
            left: constants.METHOD_NAME_COLUMN_WIDTH + 'px',
            top: (constants.COLUMN_TOP_Y + columnTotalTitleFrameHeight()) + 'px',
          }}
          onContainerScroll={this.onScroll}
          onContainerMouseMove={this.onDiagramMouseMove}
          scrollContainerRef={this.scrollContainerRef}
          largeContainerRef={this.largeContainerRef}
          onDraw={this.convertDataToPrimitiveShapes}>
          <DelayedTooltip
            delay={this.state.delay}
            tooltipClass={TooltipWithGithubButton}
            visible={this.state.tooltipVisible}
            left={this.state.tooltipLeft}
            top={this.state.tooltipTop}
            offset={this.state.tooltipOffset}
            commitHash={this.state.tooltipTitle}
            repositoryUrl={this.props.repositoryUrl}
            items={this.state.tooltipItems} />
        </GeneralDiagram>
        <ClassOverviewColumnTitles
          scrollContainerRef={this.columnTitlesScrollContainerRef}
          selectedCommits={this.props.selectedCommits}
          onMouseEnter={this.labelMouseEnter}
          onMouseMove={this.labelMouseEnter}
          onMouseLeave={this.onTitleMouseLeave}
          columnTitles={columnTitles} />
      </React.Fragment>
    );
  }
}

module.exports = ClassOverviewDiagram;
