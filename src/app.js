const { MemoryRouter, Switch, Route, Redirect, DefaultRoute } = require('react-router');

const uiConfig = require('./ui_config');
const CommitRangeView = require('./commit_range_view/commit_range_full');
const ClassOverviewView = require('./class_overview_view/class_overview_view');
const CallVolumeView = require('./call_volume_view/call_volume_view');
const Menu = require('./menu');
const React = require('react');
const ReactDOM = require('react-dom');
const diagramStyle = require('./css/diagram.css');
const ColorContext = require('./contexts/color_context');
const NavigationMenuItem = require('./navigation_menu_item');
const DiagramDataLoader = require('./diagram_data_loader');

class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeClassColor = this.changeClassColor.bind(this);
    this.setBranchColor = this.setBranchColor.bind(this);
    this.addMenuItem = this.addMenuItem.bind(this);
    this.changeDiagram = this.changeDiagram.bind(this);
    this.goBack = this.goBack.bind(this);
    this.goForward = this.goForward.bind(this);
    this.onSelectedApp = this.onSelectedApp.bind(this);
    this.enableClass = this.enableClass.bind(this);
    this.disableClass = this.disableClass.bind(this);
    this.isClassDisabled = this.isClassDisabled.bind(this);
    this.sceneContainerRef = React.createRef();
    this.refresh = () => this.forceUpdate();
    this.diagrams = {
      commitRangeView: CommitRangeView,
      classOverviewView: ClassOverviewView,
      callVolumeView: CallVolumeView,
    }
    this.state = {
      menuItems: [],
      rawData: {
        applications: [],
      },
      selectedApplication: undefined,
      colorContextValue: {
        classToColorMapping: {},
        changeClassColor: this.changeClassColor,
        branchToColorMapping: {},
        setBranchColor: this.setBranchColor,
        disabledClasses: {},
        isClassDisabled: this.isClassDisabled,
        enableClass: this.enableClass,
        disableClass: this.disableClass,
      },
    };
  }

  disableClass(className) {
    this.setState((prevState) => ({
      ...prevState,
      colorContextValue: {
        ...prevState.colorContextValue,
        disabledClasses: {
          ...prevState.colorContextValue.disabledClasses,
          [className]: true,
        },
      },
    }));
  }

  enableClass(className) {
    this.setState((prevState) => {
      const disabledClasses = {
        ...prevState.colorContextValue.disabledClasses,
      };
      delete disabledClasses[className];
      return {
        ...prevState,
        colorContextValue: {
          ...prevState.colorContextValue,
          disabledClasses,
        },
      };
    });
  }

  isClassDisabled(className) {
    const result = Boolean(this.state.colorContextValue.disabledClasses[className]);
    return result;
  }

  onSelectedApp(e) {
    this.setState((prevState) => ({
      selectedApplication: e.target.value,
      menuItems: prevState.menuItems.slice(0, 1),
    }));
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

  componentDidMount() {
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader
      .load(uiConfig.app.apiUrl)
      .then(initialData => {
        console.log(initialData);
        this.setState({
          rawData: initialData,
          selectedApplication: initialData.selectedApplication,
        });
        this.props.history.replace('/commitRangeView');
      });
    window.addEventListener('resize', this.refresh);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.refresh);
  }

  componentDidUpdate(prevProps, prevState) {
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
    const menuItems = [
      <div className="select menu-item">
        <select id="slct"
          name="slct"
          value={this.state.selectedApplication}
          onChange={this.onSelectedApp}
        >
          { this.state.rawData.applications.map((applicationName, index) => (
              <option value={applicationName}>{applicationName}</option>
            ))
          }
        </select>
      </div>,
      <NavigationMenuItem
        onBackClick={this.goBack}
        canGoBack={this.props.history.canGo(-1)}
        onFowardClick={this.goForward}
        canGoForward={this.props.history.canGo(1)}
      />,
      ...this.state.menuItems,
    ];
    const routes = Object.entries(this.diagrams)
      .map(([diagramName, DiagramComponent, index]) => {
        const path = [ `/${diagramName}`];
        if (diagramName === 'commitRangeView') {
          path.push('/');
        }
        return (
          <Route key={`route-${index}`}
            path={path}
            exact
            render={(props) => (
              <DiagramComponent url={uiConfig[diagramName].apiUrl}
                addMenuItem={this.addMenuItem}
                changeDiagram={this.changeDiagram}
                applicationName={this.state.selectedApplication}
                offsetLeft={this.sceneContainerRef.current ? this.sceneContainerRef.current.offsetLeft : 0}
                {...props}
                {...props.location.state}
              />
            )}
          />
        );
      });
    return(
      <div className="minu-container">
        <div className="box-1">
          <Menu items={menuItems} />
        </div>
        <div className="box-2"
          ref={this.sceneContainerRef}
        >
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

ReactDOM.render(
  <MemoryRouter>
    <Route component={App} />
  </MemoryRouter>,
  document.getElementById('root')
);
