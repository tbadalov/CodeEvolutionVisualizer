const React = require('react');
const ClassOverviewDiagram = require('./class_overview_diagram');
const DiagramDataLoader = require('../diagram_data_loader');
const DataConverter = require('./data_converter');
const ItemList = require('../item_list');
const ClassColorContext = require('../contexts/class_color_context');

class ClassOverviewView extends React.Component {
  constructor(props) {
    super(props);
    this.mapContextValueToView = this.mapContextValueToView.bind(this);
    this.state = {
      items: [],
    };
  }

  mapContextValueToView({ classToColorMapping }) {
    return (
      <ClassOverviewDiagram
        rawData={this.state.rawData}
        startCommit={this.props.startCommit}
        endCommit={this.props.endCommit}
        classToColorMapping={classToColorMapping}
        onDiagramChange={this.props.changeDiagram} />
    );
  }

  handleItemChange(index) {
    console.log("selecting " + index);
    this.setState({selectedClassName: this.state.items[index].label});
  }

  componentDidMount() {
    const { startCommit, endCommit } = this.props;
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader.load(
      `${this.props.url}/class_names`,
      {
        startCommit,
        endCommit,
      }
    ).then(classNames => {
      const items = classNames.map((className, index) => ({
        label: className,
        color: this.context.classToColorMapping[className],
        checked: index === 0,
      }));
      this.props.addMenuItem(
        <ItemList items={items} isRadio onItemChange={this.handleItemChange.bind(this)}/>
      );
      this.setState({items: items});
      this.setState({selectedClassName: classNames[0]});
      return classNames[0];
    })
    .catch(error => console.log(error));
  }

  componentDidUpdate() {
    if (this.state.lastClassName === this.state.selectedClassName) {
      return;
    }
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader.load(
      this.props.url,
      {
        className: this.state.selectedClassName,
        startCommit: this.props.startCommit,
        endCommit: this.props.endCommit,
      }
    ).then(rawData => {
    console.log(rawData);
    return rawData;
  })
  .then(rawData => new DataConverter().groupDataIntoCommitColumnsAndMethodRows(rawData))
  .then(groupedData => {
    console.log(groupedData);
    return groupedData;
  })
  .then(groupedData => this.setState({rawData: groupedData, lastClassName: this.state.selectedClassName}))
  .catch(error => console.log(error));
  }

  handleItemClick() {
    
  }

  render() {
    return(
      <ClassColorContext.Consumer>
        { this.mapContextValueToView }
      </ClassColorContext.Consumer>
    );
  }
}

ClassOverviewView.contextType = ClassColorContext;

module.exports = ClassOverviewView;
