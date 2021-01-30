const React = require('react');
const CallVolumeDiagramSketcher = require('./call_volume_diagram_sketcher');
const Konva = require('konva');
const SwitchCommitButton = require('./buttons/switch_commit_button');
const PlayButton = require('./buttons/play_button');

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
  updateSize.call(this);
  this.callVolumeDiagramSketcher.draw(this.stageData.stage, this.state.selectedCommit);
}

function updateSize() {
  const largeContainer = this.largeContainerRef.current;
  const scrollContainer = this.scrollContainerRef.current;
  const stage = this.stageData.stage;
  largeContainer.style.width = scrollContainer.clientWidth + 'px';
  largeContainer.style.height = scrollContainer.clientHeight + 'px';
  stage.width(scrollContainer.clientWidth);
  stage.height(scrollContainer.clientHeight);
}

class CallVolumeDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.diagramContainerRef = React.createRef();
    this.scrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.state = {
      selectedCommit: this.props.selectedCommit,
    };
    this.callVolumeDiagramSketcher = new CallVolumeDiagramSketcher(this.props.rawData, this.props.classToColorMapping);
  }

  componentDidMount() {
    const largeContainer = this.largeContainerRef.current;
    largeContainer.style.width = this.scrollContainerRef.current.clientWidth + 'px';
    largeContainer.style.height = this.scrollContainerRef.current.clientHeight + 'px';
    const stage = new Konva.Stage({
      container: this.diagramContainerRef.current,
      draggable: true,
      scale: {
        x: 3,
        y: 3,
      },
    });
    var scaleBy = 1.03;
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      //console.log(e);
      if (e.evt.deltaY > 0) {
        //console.log(stage.scaleX());
        stage.scale({x: stage.scaleX() * scaleBy, y: stage.scaleX() * scaleBy});
      } else if (e.evt.deltaY < 0) {
        stage.scale({x: stage.scaleX() / scaleBy, y: stage.scaleX() / scaleBy});
      }
      stage.destroyChildren();
      redraw.call(this);
    });
    this.stageData = {
      stage,
    };
    redraw.call(this);
  }

  componentDidUpdate() {
    redraw.call(this);
    console.log("boo");
    /*array = shuffle(data);
    console.log(array);
    const branchesVisualData = convertToVisualizationData(array, this.props.classToColorMapping);
    console.log(branchesVisualData);

    var layer = new Konva.Layer();
    this.stageData.stage.add(layer);
    drawBranches(layer, branchesVisualData);
    this.stageData.stage.scale({x: 3, y: 3});
    layer.draw();*/
  }

  render() {
    return(
      <div
        className="scroll-container"
        ref={this.scrollContainerRef} >
        <div
          className="large-container"
          ref={this.largeContainerRef} >
          <div
            className="container"
            ref={this.diagramContainerRef} >
          </div>
        </div>
        <SwitchCommitButton direction='prev' />
        <SwitchCommitButton direction='next' />
        <PlayButton />
      </div>
    );
  }
}

module.exports = CallVolumeDiagram;
