const React = require('react');
const { draw } = require('./class_overview_diagram_sketcher');
const GeneralDiagram = require('../general_diagram');

class ClassOverviewDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
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
    return(
      <GeneralDiagram
        {...this.state}
        scrollContainerRef={this.scrollContainerRef}
        largeContainerRef={this.largeContainerRef}
        onDraw={this.convertDataToPrimitiveShapes} />
    );
  }
}

module.exports = ClassOverviewDiagram;
