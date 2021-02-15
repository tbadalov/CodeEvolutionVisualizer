const React = require('react');
const ClassOverviewDiagram = require('./class_overview_diagram');
const ItemList = require('../item_list');
const DiagramDataLoader = require('../diagram_data_loader');
const DataConverter = require('./data_converter');

class ClassOverviewView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    const { startCommit, endCommit } = this.props;
    new DiagramDataLoader().load(
      this.props.url,
      {
        startCommit,
        endCommit,
      }
    ).then(rawData => new DataConverter().groupDataIntoCommitColumnsAndMethodRows(rawData))
    .then(groupedData => this.setState({rawData: groupedData}));
  }

  handleItemClick() {
    
  }

  render() {
    return(
      <div className="minu-container">
        <div className="box-1">
          <ItemList items={this.state.items} onItemChange={this.handleItemClick.bind(this)} />
        </div>
        <div className="box-2">
          <ClassOverviewDiagram
            rawData={this.state.rawData}
            startCommit={this.props.startCommit}
            endCommit={this.props.endCommit}
            classToColorMapping={this.props.classToColorMapping} />
        </div>
      </div>
    );
  }
}

module.exports = CallVolumeViewFull;
