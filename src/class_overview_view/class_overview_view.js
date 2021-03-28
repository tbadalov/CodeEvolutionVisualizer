const React = require('react');
const ClassOverviewDiagram = require('./class_overview_diagram');
const DiagramDataLoader = require('../diagram_data_loader');
const DataConverter = require('./data_converter');
const ItemList = require('../item_list');
const ColorContext = require('../contexts/color_context');
const { extractUniqueValues } = require('../utils');

class ClassOverviewView extends React.Component {
  constructor(props) {
    super(props);
    this.mapContextValueToView = this.mapContextValueToView.bind(this);
    this.handleBranchFilterItemClick = this.handleBranchFilterItemClick.bind(this);
    this.state = {
      classFilterItems: [],
      branchFilterItems: [],
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
    this.setState({selectedClassName: this.state.classFilterItems[index].label});
  }

  handleBranchFilterItemClick(branchFilterItemPayload) {
    console.log(branchFilterItemPayload);
  }

  componentDidMount() {
    const { startCommit, endCommit } = this.props;
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader.load(
      `${this.props.url}/initial_data`,
      {
        startCommit,
        endCommit,
      }
    ).then(initialData => {
      const classFilterItems = initialData.classNames.map((className, index) => ({
        label: className,
        color: this.context.classToColorMapping[className],
        checked: index === 0,
        payload: {},
      })).sort((item1, item2) => item1.label.localeCompare(item2.label));

      const branchNames = extractUniqueValues(initialData.commits.map(commit => commit.branchName));
      const branchFilterItems = branchNames.map((branchName, index) => ({
        label: branchName,
        color: this.context.branchToColorMapping[branchName],
        checked: true,
        payload: {},
      })).sort((item1, item2) => item1.label.localeCompare(item2.label));

      this.props.addMenuItem(
        <ItemList items={branchFilterItems} title='Branch filter' onItemChange={this.handleBranchFilterItemClick} />
      )
      this.props.addMenuItem(
        <ItemList items={classFilterItems} isRadio title='Class filter' onItemChange={this.handleItemChange.bind(this)}/>
      );
      this.setState({
        classFilterItems: classFilterItems,
        branchFilterItems: branchFilterItems,
      });
      this.setState({selectedClassName: classFilterItems[0].label});
      return classFilterItems[0].label;
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
      <ColorContext.Consumer>
        { this.mapContextValueToView }
      </ColorContext.Consumer>
    );
  }
}

ClassOverviewView.contextType = ColorContext;

module.exports = ClassOverviewView;
