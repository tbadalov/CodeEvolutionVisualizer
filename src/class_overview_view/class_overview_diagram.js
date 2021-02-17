const React = require('react');
const ClassOverviewDiagramSketcher = require('./class_overview_diagram_sketcher');
const ItemList = require('../item_list');
const Konva = require('konva');

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

const rawData = {
  commits: {
    hhffee: {
      classesArray: data,
    }
  }
};

class ClassOverviewDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.diagramContainerRef = React.createRef();
    this.scrollContainerRef = React.createRef();
    this.largeContainerRef = React.createRef();
    this.diagramSketcher = new ClassOverviewDiagramSketcher();
    this.state = {
      rawData: rawData,
      selectedCommit: 'hhffee',
    };
  }
  
  componentDidMount() {
    this.stage = new Konva.Stage({
        container: this.diagramContainerRef.current,
        height: this.scrollContainerRef.current.clientHeight,
        width: this.scrollContainerRef.current.clientWidth,
    });
  }

  componentDidUpdate() {
    if (this.props.rawData) {
      const stageSize = this.diagramSketcher.draw(
          this.stage,
          this.props.rawData,
          (commit) => {
            this.props.onDiagramChange('callVolumeView', {label: commit, classToColorMapping: this.props.classToColorMapping});
          }
      );
      this.stage.size(stageSize);
      this.largeContainerRef.current.style.width = stageSize.width + 'px';
      this.largeContainerRef.current.style.height = stageSize.height + 'px';
      this.stage.batchDraw();
    }
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
      </div>
    );
  }
}

module.exports = ClassOverviewDiagram;
