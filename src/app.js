const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_full');
const ClassOverviewView = require('./class_overview_view/class_overview_view');
const CallVolumeView = require('./call_volume_view/call_volume_view');
const Menu = require('./menu');
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
      menuItems: [],
    }
  }

  changeDiagram(diagramName, props) {
    this.state.currentDiagram = diagramName;
    const data = {...this.state.data};
    data.diagramData.props = props;
    this.setState({currentDiagram: diagramName, data: data, menuItems: []});
  }

  addMenuItem(menuItem) {
    this.setState({
      menuItems: [...this.state.menuItems, menuItem],
    });
  }

  render() {
    const Diagram = this.diagrams[this.state.currentDiagram];
    return(
      <div className="minu-container">
        <div className="box-1">
          <div class="select">
            <select name="slct" id="slct">
              <option value="1" selected="selected">master</option>
              <option value="2">dev</option>
              <option value="3">feature1</option>
            </select>
          </div>
          <Menu items={this.state.menuItems} />
        </div>
        <div className="box-2">
          <Diagram url={uiConfig[this.state.currentDiagram].apiUrl} addMenuItem={this.addMenuItem.bind(this)} changeDiagram={this.state.data.diagramData.changeDiagram} {...this.state.data.diagramData.props} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
