const React = require('react');
const CallVolumeDiagram = require('./call_volume_diagram');

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

class CallVolumeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rawData: rawData,
      selectedCommit: 'hhffee',
    };
  }

  handleItemClick() {

  }

  render() {
    return(
      <CallVolumeDiagram
        rawData={this.state.rawData}
        selectedCommit={this.state.selectedCommit}
        classToColorMapping={this.props.classToColorMapping} />
    );
  }
}

module.exports = CallVolumeView;
