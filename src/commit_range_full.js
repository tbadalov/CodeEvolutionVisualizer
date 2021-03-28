const React = require('react');
const CommitRangeView = require('./commit_range_view');
const ColorContext = require('./contexts/color_context');
const Item = require('./item');
const ItemList = require('./item_list');

function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

function mapClassToClassFilterItem(commit, changedClass) {
  const changedClassName = changedClass.className;
  return {
    label: changedClassName,
    color: getRandomColor(),
    checked: true,
    payload: {
      className: changedClassName,
    },
  };
}

function mapCommitToClassFilterItems(result, commit) {
  for (let i = 0; i < commit.changedClasses.length; i++) {
    const changedClass = commit.changedClasses[i];
    const changedClassName = changedClass.className;
    if (!result[changedClassName]) {
      result[changedClassName] = mapClassToClassFilterItem(commit, changedClass);
    }
  }
}

function buildClassFilterItems(data) {
  const classNameItemMapping = {};
  for (let i = 0; i < data.commits.length; i++) {
    const commit = data.commits[i];
    mapCommitToClassFilterItems(classNameItemMapping, commit);
  }
  return classNameItemMapping;
}

function mapBranchNameToFilterItem(commit, branchName) {
  return {
    label: branchName,
    color: getRandomColor(),
    checked: true,
    payload: {
      branchName: branchName,
    },
  };
}

function mapCommitToBranchFilterItem(result, commit) {
  const { branchName } = commit;
  if (!result[branchName]) {
    result[branchName] = mapBranchNameToFilterItem(commit, branchName);
  }
}

function buildBranchFilterItems(data) {
  const commitHashToItemMapping = {};
  for (let i = 0; i < data.commits.length; i++) {
    const commit = data.commits[i];
    mapCommitToBranchFilterItem(commitHashToItemMapping, commit);
  }
  return commitHashToItemMapping;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

class CommitRangeViewFull extends React.Component {
  constructor(props) {
    super(props);
    this.mapContextValueToView = this.mapContextValueToView.bind(this);
    this.handleContentFilterClick = this.handleContentFilterClick.bind(this);
    this.handleClassFilterClick = this.handleClassFilterClick.bind(this);
    this.handleBranchFilterClick = this.handleBranchFilterClick.bind(this);
    this.state = {
      items: [],
      branchFilterItems: [],
      showSourceCodeChanges: true,
      showAssetChanges: true,
      disabledClasses: {},
      data: {
        commits: [],
      },
    };
  }

  mapContextValueToView({ classToColorMapping }) {
    return (
      <CommitRangeView
        data={this.state.data}
        disabledClasses={this.state.disabledClasses}
        classToColorMapping={classToColorMapping}
        showSourceCodeChanges={this.state.showSourceCodeChanges}
        showAssetChanges={this.state.showAssetChanges}
        onDiagramChange={this.props.changeDiagram} />
    );
  }
  
  onDataReady(data) {
    const items = [];
    const classNameToClassFilterMapping = buildClassFilterItems(data);
    const commitHashToBranchFilterMapping = buildBranchFilterItems(data);

    const alpahebticallySortedItems = Object.values(classNameToClassFilterMapping)
      .sort((item1, item2) => item1.label.localeCompare(item2.label));
    const { changeClassColor } = this.context;
    alpahebticallySortedItems.forEach(item => changeClassColor(item.label, item.color));

    const alpahebticallySortedBranchFilterItems = Object.values(commitHashToBranchFilterMapping)
    .sort((item1, item2) => item1.label.localeCompare(item2.label));

    this.setState({ data });
    this.setState({
      items: alpahebticallySortedItems,
      branchFilterItems: alpahebticallySortedBranchFilterItems,
    });

    this.props.addMenuItem(
      <ItemList items={this.state.items} title='Class filter' onItemChange={this.handleClassFilterClick} />
    );
    this.props.addMenuItem(
      <ItemList items={this.state.branchFilterItems} title='Branch filter' onItemChange={this.handleBranchFilterClick} />
    );
  }

  handleContentFilterClick(clickedItem) {
    const { filterType } = clickedItem.payload;
    if (filterType === 'src') {
      this.setState({
        showSourceCodeChanges: !this.state.showSourceCodeChanges,
      });
    } else if (filterType === 'asset') {
      this.setState({
        showAssetChanges: !this.state.showAssetChanges,
      });
    }
  }

  handleClassFilterClick(clickedItem) {
    const changedItemIndex = clickedItem.index;
    console.log("Item " + clickedItem.payload.className + " with index " + clickedItem.index + " was clicked");
    const items = this.state.items.map((item, index) => {
      if (index == clickedItem.index) {
        item.checked = !item.checked;
      }
      return item;
    });
    const disabledClasses = { ...this.state.disabledClasses };
    if (!items[changedItemIndex].checked) {
      disabledClasses[items[changedItemIndex].label] = true;
    } else {
      delete disabledClasses[items[changedItemIndex].label];
    }
    this.setState({ items });
    this.setState({ disabledClasses });
  }

  handleBranchFilterClick(clickedBranchItem) {
    console.log(clickedBranchItem);
  }

  componentDidMount() {
    this.props.addMenuItem(
      <ItemList title='Content filter'>
        <Item label='Show source code changes' checked={this.state.showSourceCodeChanges} onItemChange={this.handleContentFilterClick} payload={{filterType: 'src'}} />
        <Item label='Show asset changes' checked={this.state.showAssetChanges} onItemChange={this.handleContentFilterClick} payload={{filterType: 'asset'}} />
      </ItemList>
    );
    loadData(this.props.url)
      .then(data => {
        //data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        /*data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);
        data.commits = data.commits.concat(data.commits).concat(data.commits).concat(data.commits);*/
        console.log(data);
        this.onDataReady(data);
      })
      .catch(error => console.log(error));
  }

  render() {
    return(
      <ColorContext.Consumer>
        { this.mapContextValueToView }
      </ColorContext.Consumer>
    );
  }
}

CommitRangeViewFull.contextType = ColorContext;

module.exports = CommitRangeViewFull;
