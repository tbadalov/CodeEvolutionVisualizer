const React = require('react');
const { draw } = require('./class_overview_diagram_sketcher');
const GeneralDiagram = require('../general_diagram');
const ClassOverviewMethodLegend = require('./class_overview_method_legend');
const ClassOverviewColumnTitles = require('./class_overview_column_titles');
const constants = require('./constants');
const { columnTotalTitleFramHeight, columnTotalTitleFrameHeight } = require('./class_overview_diagram_positioner');

class ClassOverviewDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.columnTitlesScrollContainerRef = React.createRef();
    this.methodLegendScrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.onScroll = this.onScroll.bind(this);
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
    console.log(e);
    this.columnTitlesScrollContainerRef.current.scrollTo(scrollLeft, scrollTop);
    this.methodLegendScrollContainerRef.current.scrollTo(scrollLeft, scrollTop);
  }

  componentDidUpdate(prevProps) {
    if (this.props.rawData !== prevProps.rawData || this.props.branchToColorMapping !== prevProps.branchToColorMapping || this.props.disabledBranches !== prevProps.disabledBranches) {
      const drawResult = draw(
          this.props.rawData,
          (commit) => {
            this.props.onDiagramChange('callVolumeView', {label: commit, classToColorMapping: this.props.classToColorMapping});
          },
          this.props.branchToColorMapping,
          this.props.disabledBranches
      );

      this.largeContainerRef.current.style.width = drawResult.stageSize.width + 'px';
      this.largeContainerRef.current.style.height = drawResult.stageSize.height + 'px';
      this.convertDataToPrimitiveShapes = () => drawResult.primitiveShapes;
      this.setState({
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
    const methodNameToRowNumberMapping = this.props.rawData ? this.props.rawData.methodNameToRowNumberMapping : {};
    const methods = Object.entries(methodNameToRowNumberMapping)
      .sort(([, methodRow1], [, methodRow2]) => methodRow1 - methodRow2)
      .map(([methodName]) => ({
        methodName,
      }));
    const columnTitles = this.props.rawData ? this.props.rawData.columns : [];
    return(
      <React.Fragment>
        <ClassOverviewMethodLegend
          scrollContainerRef={this.methodLegendScrollContainerRef}
          methods={methods} />
        <ClassOverviewColumnTitles
          scrollContainerRef={this.columnTitlesScrollContainerRef}
          columnTitles={columnTitles} />
        <GeneralDiagram
          {...this.state}
          rootStyle={{
            position: 'absolute',
            left: constants.METHOD_NAME_COLUMN_WIDTH + 'px',
            top: columnTotalTitleFrameHeight() + 'px',
          }}
          onContainerScroll={this.onScroll}
          scrollContainerRef={this.scrollContainerRef}
          largeContainerRef={this.largeContainerRef}
          onDraw={this.convertDataToPrimitiveShapes} />
      </React.Fragment>
    );
  }
}

module.exports = ClassOverviewDiagram;
