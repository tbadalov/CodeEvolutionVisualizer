const React = require('react');
const Konva = require('konva');
const { draw } = require('./class_overview_diagram_sketcher');
const GeneralDiagram = require('../general_diagram');

class ClassOverviewDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.state = {
      rawData: { commits: {} },
      width: 0,
      height: 0,
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
          onWheel: this.onStageWheelEventListener,
        },
        convertDataToPrimitiveShapes: () => [],
      },
    };
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
      this.setState({
          largeContainerHeight: drawResult.stageSize.height,
          primitiveDiagramProps: {
              ...this.state.primitiveDiagramProps,
              stageProps: {
                  ...this.state.primitiveDiagramProps.stageProps,
                  ...drawResult.stageSize,
              },
              convertDataToPrimitiveShapes: () => drawResult.primitiveShapes,
          },
      })
    }
  }

  render() {
    return(
      <GeneralDiagram {...this.state} scrollContainerRef={this.scrollContainerRef} largeContainerRef={this.largeContainerRef} />
    );
  }
}

module.exports = ClassOverviewDiagram;
