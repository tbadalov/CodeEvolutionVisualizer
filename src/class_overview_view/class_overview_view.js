const React = require('react');
const ClassOverviewDiagram = require('./class_overview_diagram');
const DiagramDataLoader = require('../diagram_data_loader');
const DataConverter = require('./data_converter');
const CheckboxItem = require('../checkbox_item');
const ItemList = require('../item_list');
const ColorContext = require('../contexts/color_context');
const { extractUniqueValues } = require('../utils');

class ClassOverviewView extends React.Component {
  constructor(props) {
    super(props);
    this.mapContextValueToView = this.mapContextValueToView.bind(this);
    this.handleBranchFilterItemClick = this.handleBranchFilterItemClick.bind(this);
    this.onCollapseItems = this.onCollapseItems.bind(this);
    this.state = {
      classFilterItems: [],
      branchFilterItems: [],
      disabledBranches: {},
      collapseSameCommits: false,
    };
  }

  mapContextValueToView({ branchToColorMapping, classToColorMapping }) {
    return (
      <ClassOverviewDiagram
        rawData={this.state.rawData}
        startCommit={this.props.startCommit}
        endCommit={this.props.endCommit}
        disabledBranches={this.state.disabledBranches}
        collapseSameCommits={this.state.collapseSameCommits}
        classToColorMapping={classToColorMapping}
        branchToColorMapping={branchToColorMapping}
        onCollapseItems={this.onCollapseItems}
        onDiagramChange={this.props.changeDiagram} />
    );
  }

  onCollapseItems() {
    this.setState({
      collapseSameCommits: !this.state.collapseSameCommits,
    });
  }

  handleItemChange(index) {
    console.log("selecting " + index);
    this.setState({selectedClassName: this.state.classFilterItems[index].label});
  }

  handleBranchFilterItemClick(clickedBranchFilterItem) {
    const { branchName } = clickedBranchFilterItem.payload;
    const updatedBranchFilterItems = this.state.branchFilterItems.map((branchFilterItem, index) => {
      if (index === clickedBranchFilterItem.index) {
        branchFilterItem.checked = !branchFilterItem.checked;
      }
      return branchFilterItem;
    });
    this.setState({
      branchFilterItems: updatedBranchFilterItems,
      disabledBranches: {
        ...this.state.disabledBranches,
        [branchName]: !updatedBranchFilterItems[clickedBranchFilterItem.index].checked,
      },
    });
  }

  componentDidMount() {
    this.updateContentFilter = this.props.addMenuItem(
      <ItemList title='Content filter'>
        <CheckboxItem label='Collapse equal states' checked={this.state.collapseSameCommits} onItemChange={this.onCollapseItems} />
      </ItemList>
    );
    const { applicationName, startCommit, endCommit } = this.props;
    const diagramDataLoader = new DiagramDataLoader();
    diagramDataLoader.load(
      `${this.props.url}/initial_data`,
      {
        applicationName,
        selectedCommitHashes: this.props.selectedCommitHashes,
      }
    ).then(initialData => {
      const classFilterItems = initialData.classNames
      .filter(className => !this.context.isClassDisabled(className))
      .map((className, index) => ({
        label: className,
        checked: index === 0,
        payload: {
          className: className,
        },
      })).sort((item1, item2) => item1.label.localeCompare(item2.label));

      const branchNames = extractUniqueValues(initialData.commits.map(commit => commit.branchName));
      const branchFilterItems = branchNames.map((branchName, index) => ({
        label: branchName,
        color: this.context.branchToColorMapping[branchName],
        checked: true,
        payload: {
          branchName: branchName,
        },
      })).sort((item1, item2) => item1.label.localeCompare(item2.label));

      this.props.addMenuItem(
        <ItemList items={branchFilterItems} title='Branch filter' onItemChange={this.handleBranchFilterItemClick} />
      )
      this.props.addMenuItem(
        <ItemList items={classFilterItems} isRadio title='Class selector' onItemChange={this.handleItemChange.bind(this)}/>
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

  componentDidUpdate(prevProps, prevState) {
    if (this.state.lastClassName !== this.state.selectedClassName) {
      const diagramDataLoader = new DiagramDataLoader();
      diagramDataLoader.load(
        this.props.url,
        {
          className: this.state.selectedClassName,
          selectedCommitHashes: this.props.selectedCommitHashes,
          applicationName: this.props.applicationName,
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
      .then(groupedData => {
        this.setState({rawData: groupedData, lastClassName: this.state.selectedClassName});
      })
      .catch(error => console.log(error));
    }

    if (this.state.collapseSameCommits !== prevState.collapseSameCommits) {
      this.updateContentFilter(
        <ItemList title='Content filter'>
          <CheckboxItem label='Collapse equal states' checked={this.state.collapseSameCommits} onItemChange={this.onCollapseItems} />
        </ItemList>
      );
    }
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
