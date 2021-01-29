const React = require('react');
const CallVolumeDiagramPositioner = require('./call_volume_diagram_positioner');
const SwitchCommitButton = require('./switch_commit_button');

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

const data = [
  {
      "class": "BrewState",
      "methods": [
          {
              "callAmount": 1,
              "method": "decode(json:)"
          },
      ],
      "totalCallAmount": 1
  },
  {
      "class": "BrewCell",
      "methods": [
          {
              "callAmount": 4,
              "method": "setTextColorForAllLabels(color:)"
          }
      ],
      "totalCallAmount": 4
  },
  {
      "class": "Brew",
      "methods": [
          {
              "callAmount": 9,
              "method": "decode(json:)"
          }
      ],
      "totalCallAmount": 9
  },
  {
      "class": "BrewViewController",
      "methods": [
          {
              "callAmount": 1,
              "method": "tableView(tableView:numberOfRowsInSection:)"
          },
          {
              "callAmount": 9,
              "method": "stateText(brewPhase:)"
          },
          {
              "callAmount": 9,
              "method": "updateStartTimeLabel()"
          },
          {
              "callAmount": 2,
              "method": "updateTempLabel(temperature:)"
          },
          {
              "callAmount": 2,
              "method": "didReceiveMemoryWarning()"
          },
          {
              "callAmount": 2,
              "method": "viewDidLoad()"
          },
          {
              "callAmount": 6,
              "method": "connectToHost()"
          }
      ],
      "totalCallAmount": 31
  },
  {
      "class": "AppDelegate",
      "methods": [
          {
              "callAmount": 3,
              "method": "application(application:didFinishLaunchingWithOptions:)"
          },
          {
              "callAmount": 5,
              "method": "applicationWillResignActive(application:)"
          },
          {
              "callAmount": 6,
              "method": "applicationDidEnterBackground(application:)"
          },
          {
              "callAmount": 3,
              "method": "applicationWillEnterForeground(application:)"
          },
          {
              "callAmount": 6,
              "method": "applicationDidBecomeActive(application:)"
          },
          {
              "callAmount": 7,
              "method": "applicationWillTerminate(application:)"
          }
      ],
      "totalCallAmount": 30
  },
  {
      "class": "BrewPhase",
      "methods": [
          {
              "callAmount": 4,
              "method": "decode(json:)"
          },
          {
              "callAmount": 6,
              "method": "create(jobEnd:)"
          }
      ],
      "totalCallAmount": 10
  },
  {
      "class": "JSONDecodable",
      "methods": [
          {
              "callAmount": 2,
              "method": "decode(json:)"
          }
      ],
      "totalCallAmount": 2
  },
];

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

function drawBranches(layer, branches) {
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    for (let pipe of branch.pipes) {
      console.log(pipe);
      if (pipe.type == 'rect') {
        layer.add(new Konva.Rect({
          x: pipe.startX,
          y: pipe.startY,
          width: pipe.width,
          height: pipe.height,
          fill: pipe.color,
          scaleX: pipe.scaleX,
          scaleY: pipe.scaleY,
        }));
      } else if (pipe.type == 'arc') {
        layer.add(new Konva.Arc({
          x: pipe.centerX,
          y: pipe.centerY,
          innerRadius: pipe.radius - pipe.thickness,
          outerRadius: pipe.radius,
          angle: pipe.angle,
          fill: pipe.color,
          scaleX: pipe.scaleX,
          scaleY: pipe.scaleY,
        }));
      }
    }
    for (let leave of branch.leaves) {
      layer.add(new Konva.Rect({
        x: leave.stem.startX,
        y: leave.stem.startY,
        width: leave.stem.width,
        height: leave.stem.height,
        fill: leave.stem.color,
        scaleX: leave.stem.scaleX,
        scaleY: leave.stem.scaleY,
      }));
      layer.add(new Konva.Circle({
        x: leave.node.centerX,
        y: leave.node.centerY,
        radius: leave.node.radius,
        fill: leave.node.color,
      }));
    }
  }
}

function convertToVisualizationData(classesArray, classToColorMapping) {
  if (classesArray.length == 0) {
    return [];
  }
  const branches = [];
  const diagramPositioner = new CallVolumeDiagramPositioner(classesArray);
  window.diagramPositioner = diagramPositioner;
  for (let i = 0; i < classesArray.length; i++) {
    const classData = classesArray[i];
    const branchData = {
      color: classToColorMapping[classData.class],
    };
    const methods = classData.methods.sort((method1, method2) => method1.callAmount - method2.callAmount);
    const pipes = [
      {
        type: 'rect',
        startX: diagramPositioner.trunkX(i),
        startY: marginTop,
        height: diagramPositioner.trunkHeight(i),
        width: diagramPositioner.pipeWidth(i),
        color: branchData.color,
      },
    ];
    const leaves = [];
    currentPositionX = diagramPositioner.branchStartX(i);
    branchStartingPositionY = diagramPositioner.branchStartY(i);
    let branchStartingPositionX = diagramPositioner.branchStartX(i);
    let directionX = diagramPositioner.directionX(i);
    let directionY = diagramPositioner.directionY(i);
    for ( let m = 0; m < methods.length; m++ ) {
      const method = methods[m];
      leaves.push({
        data: {
          name: method.name,
        },
        stem: {
          type: 'rect',
          color: branchData.color,
          ...diagramPositioner.stemPosition(i, m),
        },
        node: {
          type: 'circle',
          color: branchData.color,
          ...diagramPositioner.nodePosition(i, m),
        },
      });
    }
    if (diagramPositioner.directionY(i) == 0) {
      pipes.push({
        type: 'rect',
        startX: diagramPositioner.branchStartX(i),
        startY: diagramPositioner.branchStartY(i),
        width: diagramPositioner.pipeWidth(i),
        height: diagramPositioner.stemPosition(i, methods.length-1).startY - diagramPositioner.branchStartY(i),
        color: branchData.color,
        scaleY: 1,
      });
      pipes.push({
        type: 'arc',
        thickness: diagramPositioner.stemWidthFor(i, methods.length-1),
        radius: diagramPositioner.stemWidthFor(i, methods.length-1),
        centerX: diagramPositioner.stemPosition(i, methods.length-1).startX,
        centerY: diagramPositioner.stemPosition(i, methods.length-1).startY,
        angle: 90,
        color: branchData.color,
        scaleX: -1 * ((methods.length-1) % 2 == 0 ? -1 : 1) * (diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))), // 1 to draw arc to left, -1 to draw to right
        scaleY: 1,
      });
    } else {
      pipes.push({
        type: 'arc',
        thickness: diagramPositioner.pipeWidth(i),
        radius: diagramPositioner.trunkAngleRadius(i),
        centerX: diagramPositioner.trunkAngleCenterX(i),
        centerY: diagramPositioner.trunkAngleCenterY(i),
        angle: 90,
        color: branchData.color,
        scaleX: -1 * diagramPositioner.directionX(i), // 1 to draw arc to left, -1 to draw to right
      });
      pipes.push({
        type: 'rect',
        startX: diagramPositioner.branchStartX(i),
        startY: diagramPositioner.branchStartY(i),
        width: (diagramPositioner.stemPosition(i, methods.length-1).startX - branchStartingPositionX) * diagramPositioner.directionX(i),
        height: diagramPositioner.pipeWidth(i),
        color: branchData.color,
        scaleX: diagramPositioner.directionX(i),
        scaleY: -1 * diagramPositioner.directionY(i),
      });
      pipes.push({
        type: 'arc',
        thickness: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1)),
        radius: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1)),
        centerX: diagramPositioner.stemPosition(i, methods.length-1).startX,
        centerY: diagramPositioner.branchStartY(i),
        angle: 90,
        color: branchData.color,
        scaleX: diagramPositioner.directionX(i), // 1 to draw arc to left, -1 to draw to right
        scaleY: -(diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))) * diagramPositioner.directionY(i),
      });
    }
    branches.push({
      data: branchData,
      pipes: pipes,
      leaves: leaves,
    });
  }
  return branches;
}

class CallVolumeView extends React.Component {
  constructor(props) {
    super(props);
    this.diagramContainerRef = React.createRef();
    this.scrollContainer = React.createRef();
    this.largeContainer = React.createRef();
  }

  componentDidMount() {
    const stage = new Konva.Stage({
      container: this.diagramContainerRef.current,
      width: width,
      height: height,
    });
    this.stageData = {
      stage,
    };
    console.log("xiii");
    const largeContainer = this.largeContainer.current;
    largeContainer.style.width = width + 'px';
    //height should be assigned after width because of appearing scrollbar
    largeContainer.style.height = 700 + 'px';
    stage.height(700);
    //const stage = this.stageData.stage;
    array = shuffle(data);
    console.log(array);
    const branchesVisualData = convertToVisualizationData(array, this.props.classToColorMapping);
    console.log(branchesVisualData);

    var layer = new Konva.Layer();
    stage.add(layer);

    drawBranches(layer, branchesVisualData);
    stage.scale({x: 3, y: 3});
    layer.draw();
  }

  componentDidUpdate() {
    
  }

  render() {
    return(
      <div
        className="scroll-container"
        ref={this.scrollContainer} >
        <div
          className="large-container"
          ref={this.largeContainer} >
          <div
            className="container"
            ref={this.diagramContainerRef} >
          </div>
        </div>
        <SwitchCommitButton direction='prev' />
        <SwitchCommitButton direction='next' />
      </div>
    );
  }
}

module.exports = CallVolumeView;
