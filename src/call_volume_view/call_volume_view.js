const React = require('react');
const ColorContext = require('../contexts/color_context');
const DiagramDataLoader = require('../diagram_data_loader');
const ItemList = require('../item_list');
const CallVolumeDiagram = require('./call_volume_diagram');

class CallVolumeView extends React.Component {
  constructor(props) {
    super(props);
    this.mapContextValueToView = this.mapContextValueToView.bind(this);
    this.handleItemChange = this.handleItemChange.bind(this);
    this.switchCommit = this.switchCommit.bind(this);
    this.state = {
      rawData: undefined,
      selectedCommit: undefined,
    };
    console.log(props);
  }

  handleItemChange() {

  }

  mapContextValueToView({ classToColorMapping }) {
    return (
      <CallVolumeDiagram
        rawData={this.state.rawData}
        selectedCommit={this.state.selectedCommit}
        previousCommitHash={this.state.rawData && this.state.rawData.previousCommitHash}
        nextCommitHash={this.state.rawData && this.state.rawData.nextCommitHash}
        selectedClassNames={this.props.selectedClassNames}
        switchCommit={this.switchCommit}
        classToColorMapping={classToColorMapping} />
    );
  }

  switchCommit(commitHash) {
    this.setState({
        selectedCommit: commitHash,
    });
  }

  loadCommit() {
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader.load(
        this.props.url,
        {
            commit: this.state.selectedCommit,
            applicationName: this.props.applicationName,
        }
    ).then(rawData => {
        this.setState({
            rawData: rawData,
        });
        console.log(rawData);
    })
    .catch(error => console.log(error));
  }

  componentDidMount() {
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader.load(
      `${this.props.url}/class_names`,
      {
          commit: this.props.selectedCommit,
      }
    ).then(classNames => {
      const items = classNames.map((className, index) => ({
        label: className,
        color: this.context.classToColorMapping[className],
        checked: this.props.selectedClassNames.includes(className),
      }));
      this.setState({
          classFilterItems: items,
      });
      this.updateMenuItem = this.props.addMenuItem(
        <ItemList items={items} onItemChange={this.handleItemChange}/>
      );
    })
    .catch(error => console.log(error));
    this.setState({
        selectedCommit: this.props.selectedCommit,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.classFilterItems !== prevState.classFilterItems) {
        if (this.updateMenuItem) {
            this.updateMenuItem(
                <ItemList items={this.state.classFilterItems} onItemChange={this.handleItemChange}/>
            );
        }
    }
    if (this.state.selectedCommit !== prevState.selectedCommit) {
        this.loadCommit();
    }
  }

  render() {
    return(
        <ColorContext.Consumer>
            { this.mapContextValueToView }
        </ColorContext.Consumer>
    );
  }
}

CallVolumeView.contextType = ColorContext;

module.exports = CallVolumeView;
