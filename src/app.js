const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_full');
const ClassOverviewView = require('./class_overview_view/class_overview_view');
const CallVolumeView = require('./call_volume_view/call_volume_view');
const Menu = require('./menu');
const React = require('react');
const ReactDOM = require('react-dom');
const diagramStyle = require('./css/diagram.css');
const ColorContext = require('./contexts/color_context');

class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeClassColor = this.changeClassColor.bind(this);
    this.setBranchColor = this.setBranchColor.bind(this);
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
      colorContextValue: {
        classToColorMapping: {},
        changeClassColor: this.changeClassColor,
        branchToColorMapping: {},
        setBranchColor: this.setBranchColor,
      },
    }
  }

  setBranchColor(branchName, color) {
    const branchToColorMapping = {
      ...this.state.colorContextValue.branchToColorMapping,
      [branchName]: color,
    };
    this.setState({
      colorContextValue: {
        ...this.state.colorContextValue,
        branchToColorMapping,
      },
    });
  }

  changeClassColor(className, color) {
    const classToColorMapping = {
      ...this.state.colorContextValue.classToColorMapping,
      [className]: color,
    };
    this.setState({
      colorContextValue: {
        ...this.state.colorContextValue,
        classToColorMapping,
      },
    });
  }

  changeDiagram(diagramName, props) {
    this.state.currentDiagram = diagramName;
    const data = {...this.state.data};
    data.diagramData.props = props;
    this.setState({currentDiagram: diagramName, data: data, menuItems: []});
  }

  addMenuItem(menuItem, priority) {
    let menuItems = [...this.state.menuItems];
    priority = Math.min(priority || menuItems.length, menuItems.length);
    menuItems.splice(priority, 0, menuItem);
    this.setState({
      menuItems: menuItems,
    });
    const replace = (newItem) => {
      menuItems = [...this.state.menuItems];
      menuItems.splice(priority, 1, newItem);
      this.setState({
        menuItems: menuItems,
      });
    }
    return replace;
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
          <ColorContext.Provider value={this.state.colorContextValue}>
            <Diagram url={uiConfig[this.state.currentDiagram].apiUrl} addMenuItem={this.addMenuItem.bind(this)} changeDiagram={this.state.data.diagramData.changeDiagram} {...this.state.data.diagramData.props} />
          </ColorContext.Provider>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('root'));
