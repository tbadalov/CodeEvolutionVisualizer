const { MemoryRouter, Switch, Route, Redirect, DefaultRoute } = require('react-router');

const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_full');
const ClassOverviewView = require('./class_overview_view/class_overview_view');
const CallVolumeView = require('./call_volume_view/call_volume_view');
const Menu = require('./menu');
const React = require('react');
const ReactDOM = require('react-dom');
const diagramStyle = require('./css/diagram.css');
const ColorContext = require('./contexts/color_context');
const NavigationMenuItem = require('./navigation_menu_item');
const BlenderUi = require('blender-ui');
const splitStyle = require('blender-ui/dist/blender-ui.css');

class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeClassColor = this.changeClassColor.bind(this);
    this.setBranchColor = this.setBranchColor.bind(this);
    this.addMenuItem = this.addMenuItem.bind(this);
    this.changeDiagram = this.changeDiagram.bind(this);
    this.goBack = this.goBack.bind(this);
    this.goForward = this.goForward.bind(this);
    this.appRef = React.createRef();
    this.diagrams = {
      commitRangeView: CommitRangeView,
      classOverviewView: ClassOverviewView,
      callVolumeView: CallVolumeView,
    }
    this.state = {
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
    this.setState({
      menuItems: [],
    });
    this.props.history.push(`/${diagramName}`, props);
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

  componentDidUpdate() {
    if (this.state.redirectPath !== undefined) {
      this.setState({
        redirectPath: undefined,
      });
    }
  }

  componentDidMount() {
    this.mytree = new BlenderUi('#root', {
      minSize: 50,
      content: () => this.appRef.current,
    });
  }

  goBack() {
    this.setState({
      menuItems: [],
    });
    this.props.history.goBack();
  }

  goForward() {
    this.setState({
      menuItems: [],
    });
    this.props.history.goForward();
  }

  render() {
    console.log(this.props);
    window.his = this.props.history;
    if (this.state.redirectPath !== undefined) {
      return <Redirect push to={this.state.redirectPath} />;
    }
    const menuItems = [
      <NavigationMenuItem
        onBackClick={this.goBack}
        canGoBack={this.props.history.canGo(-1)}
        onFowardClick={this.goForward}
        canGoForward={this.props.history.canGo(1)}
      />,
      ...this.state.menuItems,
    ];
    const routes = Object.entries(this.diagrams)
      .map(([diagramName, DiagramComponent, index]) => (
        <Route key={`route-${index}`}
          path={`/${diagramName}`}
          exact
          render={(props) => (
            <DiagramComponent url={uiConfig[diagramName].apiUrl}
              addMenuItem={this.addMenuItem}
              changeDiagram={this.changeDiagram}
              {...props}
              {...props.location.state}
            />
          )}
        />
      ));
    routes.push(
      <Route key='default-route'
        exact
        path="/"
        render={(props) => (
          <CommitRangeView url={uiConfig.commitRangeView.apiUrl}
            addMenuItem={this.addMenuItem}
            changeDiagram={this.changeDiagram}
            {...props}
            {...props.location.state}
          />
        )}
      />
    );
    return(
      <div className="minu-container" ref={this.appRef}>
        <div className="box-1">
          <div class="select">
            <select name="slct" id="slct">
              <option value="1" selected="selected">master</option>
              <option value="2">dev</option>
              <option value="3">feature1</option>
            </select>
          </div>
          <Menu items={menuItems} />
        </div>
        <div className="box-2">
          <ColorContext.Provider value={this.state.colorContextValue}>
            <Switch>
              { routes }
            </Switch>
          </ColorContext.Provider>
        </div>
      </div>
    );
  }
}

const tempContainer = document.createElement('div');

ReactDOM.render(
  <MemoryRouter>
    <Route component={App} />
  </MemoryRouter>,
  tempContainer
);
