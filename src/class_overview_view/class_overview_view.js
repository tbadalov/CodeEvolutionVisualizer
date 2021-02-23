const React = require('react');
const ClassOverviewDiagram = require('./class_overview_diagram');
const DiagramDataLoader = require('../diagram_data_loader');
const DataConverter = require('./data_converter');
const ItemList = require('../item_list');

class ClassOverviewView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
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
        color: this.props.classToColorMapping[className],
        checked: index === 0,
      }));
      this.props.addMenuItem(
        <ItemList items={items} />
      );
      this.setState({items: items});
      return classNames[0];
    })
    .then(className => {
      return diagramDataLoader.load(
        this.props.url,
        {
          className: className,
          startCommit,
          endCommit,
        }
      );
    }).then(rawData => {
      console.log(rawData);
      return rawData;
    })
    .then(rawData => new DataConverter().groupDataIntoCommitColumnsAndMethodRows(rawData))
    .then(groupedData => {
      console.log(groupedData);
      return groupedData;
    })
    .then(groupedData => this.setState({rawData: groupedData}))
    .catch(error => console.log(error));
  }

  handleItemClick() {
    
  }

  render() {
    return(
      <ClassOverviewDiagram
        rawData={this.state.rawData}
        startCommit={this.props.startCommit}
        endCommit={this.props.endCommit}
        classToColorMapping={this.props.classToColorMapping}
        onDiagramChange={this.props.changeDiagram} />
    );
  }
}

module.exports = ClassOverviewView;
