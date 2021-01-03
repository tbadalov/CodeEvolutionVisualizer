const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_view');
const React = require('react');
const ReactDOM = require('react-dom');
const diagramStyle = require('./css/diagram.css');

class App extends React.Component {
  constructor() {
    super()
    this.diagrams = {
      commitRangeView: CommitRangeView,
    }
    this.state = {
      currentDiagram: 'commitRangeView',
      data: {
        diagramData: {
          props: {},
          changeDiagram: this.changeDiagram,
        },
      },
    }
  }

  changeDiagram(diagramName, props) {
    this.state.currentDiagram = diagramName;
    this.state.data.diagramData.props = props;
    this.setState(this.state);
  }

  render() {
    const Diagram = this.diagrams[this.state.currentDiagram];
    return(
      <div id="container">
        <div id="flexbox">
          <div id="leftMenu">
          </div>
          <div id="rightMenu">
            <Diagram url={uiConfig[this.state.currentDiagram].apiUrl} {...this.state.data.diagramData} />
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
