const React = require('react');
const SwitchCommitButton = require('./buttons/switch_commit_button');
const PlayButton = require('./buttons/play_button');
const GeneralDiagram = require('../general_diagram');
const { draw, convertToVisualizationData } = require('./call_volume_diagram_sketcher');

const scale = 5;
const circleMarginX = 6;
const circleMarginY = 4;
const strokeWidth = 0;
const pipeAngleRadius = 4;
const floorMargin = 10;
const stemLength = 10;
const stemWidth = 6;
var width = 1000;
var height = 600;
const centerX = width / 5;
const centerY = 0;
const marginTop = 0;
const trunkHeight = 45; //todo remove and use INITIAL_TRUNK_HEIGHT
const INITIAL_TRUNK_HEIGHT = 45;
const FLOOR_MARGIN_VERTICAL = 2;
const INIT_STEM_LENGTH = 10;
const floors = [];

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function redraw() {
  this.stageData.stage.destroyChildren();
  updateSize.call(this);
  this.callVolumeDiagramSketcher.draw(this.stageData.stage, this.state.selectedCommit);
}

function dragBoundary(pos) {
  var newY = Math.min(0, pos.y);
  return {
    x: pos.x,
    y: newY,
  };
}

class CallVolumeDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.onWheel = this.onWheel.bind(this);
    this.state = {
      primitiveDiagramProps: {
        stageProps: {
          draggable: true,
          dragBoundFunc: dragBoundary,
          scaleX: 3,
          scaleY: 3,
          width: 0,
          height: 0,
        },
      },
    };
  }

  onWheel(e) {
    const scaleBy = 1.03;
    const stage = e.target.getStage();
    var pointer = stage.getPointerPosition();
    var oldScale = stage.scaleX();
    var mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    var newScale =
        e.evt.deltaY > 0 ? oldScale * scaleBy : (e.evt.deltaY < 0 ? oldScale / scaleBy : oldScale);

    var newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    this.setState({
      primitiveDiagramProps: {
        ...this.state.primitiveDiagramProps,
        stageProps: {
          ...this.state.primitiveDiagramProps.stageProps,
          ...dragBoundary(newPos),
          scaleX: newScale,
          scaleY: newScale,
        },
      },
    });
  }

  componentDidMount() {
    // what? ?stage.position(dragBoundary({x: -(stage.width()/2)*stage.scaleX() + this.scrollContainerRef.current.clientWidth / 2, y: stage.y()}));
    console.log(this.scrollContainerRef.current.clientWidth);
    this.setState({
      primitiveDiagramProps: {
        ...this.state.primitiveDiagramProps,
        stageProps: {
          ...this.state.primitiveDiagramProps.stageProps,
          width: this.scrollContainerRef.current.clientWidth,
          height: this.scrollContainerRef.current.clientHeight,
          x: this.scrollContainerRef.current.clientWidth/2,
        },
      },
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.rawData !== prevProps.rawData || this.state.primitiveDiagramProps !== prevState.primitiveDiagramProps) {
      console.log(this.props.rawData);
      const rawData = this.props.rawData.filter(classRecord => classRecord.totalCallAmount > 0);
      const visualizationData = convertToVisualizationData(rawData, {
        classToColorMapping: this.props.classToColorMapping,
      });
      console.log(visualizationData);
      const konvaShapes = draw(visualizationData);
      this.onDraw = () => {
        return konvaShapes;
      }
      this.forceUpdate();
    }
  }

  render() {
    const randomDiagramGenerator = () => {
      this.props.rawData.commits[this.state.selectedCommit].classesArray = shuffle(this.props.rawData.commits[this.state.selectedCommit].classesArray);
      this.forceUpdate();
      };
    return(
      <GeneralDiagram {...this.state}
        onWheel={this.onWheel}
        scrollContainerRef={this.scrollContainerRef}
        onDraw={this.onDraw}>
        <SwitchCommitButton direction='prev' onSwitchCommitButtonClick={randomDiagramGenerator} />
        <SwitchCommitButton direction='next' onSwitchCommitButtonClick={randomDiagramGenerator} />
        <PlayButton />
      </GeneralDiagram>
    );
  }
}

module.exports = CallVolumeDiagram;
