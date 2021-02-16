const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_full');
const ClassOverviewView = require('./class_overview_view/class_overview_view');
const CallVolumeView = require('./call_volume_view/call_volume_view');
const React = require('react');
const ReactDOM = require('react-dom');
const diagramStyle = require('./css/diagram.css');

class App extends React.Component {
  constructor() {
    super()
    this.diagrams = {
      commitRangeView: CommitRangeView,
      classOverviewView: ClassOverviewView,
      callVolumeView: CallVolumeView,
    }
    this.state = {
      currentDiagram: 'commitRangeView',
      data: {
        diagramData: {
          props: {},
          changeDiagram: this.changeDiagram.bind(this),
        },
      },
    }
  }

  changeDiagram(diagramName, props) {
    this.state.currentDiagram = diagramName;
    const data = {...this.state.data};
    data.diagramData.props = props;
    this.setState({currentDiagram: diagramName, data: data});
  }

  render() {
    const Diagram = this.diagrams[this.state.currentDiagram];
    return(
      <Diagram url={uiConfig[this.state.currentDiagram].apiUrl} changeDiagram={this.state.data.diagramData.changeDiagram} {...this.state.data.diagramData.props} />
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
