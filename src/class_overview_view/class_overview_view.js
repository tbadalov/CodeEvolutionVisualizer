const React = require('react');
const ClassOverviewDiagram = require('./class_overview_diagram');
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
        className: 'BrewViewController',
        startCommit,
        endCommit,
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
