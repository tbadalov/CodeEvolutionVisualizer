const React = require('react');
const CommitRangeView = require('./commit_range_view');
const ColorContext = require('../contexts/color_context');
const DiagramDataLoader = require('../diagram_data_loader');
const CheckboxItem = require('../checkbox_item');
const ItemList = require('../item_list');
const DataAdapter = require('../data_adapter');

function mapClassToClassFilterItem(commit, changedClass, params) {
  const {
    classToColorMapping,
    isClassDisabled,
  } = params;
  const changedClassName = changedClass.className;
  return {
    label: changedClassName,
    color: classToColorMapping[changedClassName] || getRandomColor(),
    checked: !isClassDisabled(changedClassName),
    payload: {
      className: changedClassName,
    },
  };
}

function mapCommitToClassFilterItems(result, commit, params) {
  for (let i = 0; i < commit.changedClasses.length; i++) {
    const changedClass = commit.changedClasses[i];
    const changedClassName = changedClass.className;
    if (!result[changedClassName]) {
      result[changedClassName] = mapClassToClassFilterItem(commit, changedClass, params);
    }
  }
}

function buildClassFilterItems(data, params) {
  const classNameItemMapping = {};
  for (let i = 0; i < data.commits.length; i++) {
    const commit = data.commits[i];
    mapCommitToClassFilterItems(classNameItemMapping, commit, params);
  }
  return Object.values(classNameItemMapping);
}

function mapBranchNameToFilterItem(commit, branchName, branchToColorMapping) {
  return {
    label: branchName,
    color: branchToColorMapping[branchName] || getRandomColor(),
    checked: true,
    payload: {
      branchName: branchName,
    },
  };
}

function mapCommitToBranchFilterItem(result, commit, branchToColorMapping) {
  const { branchName } = commit;
  if (!result[branchName]) {
    result[branchName] = mapBranchNameToFilterItem(commit, branchName, branchToColorMapping);
  }
}

function buildBranchFilterItems(data, branchToColorMapping) {
  const commitHashToItemMapping = {};
  for (let i = 0; i < data.commits.length; i++) {
    const commit = data.commits[i];
    mapCommitToBranchFilterItem(commitHashToItemMapping, commit, branchToColorMapping);
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
    this.state = this.props.location.state || {
      items: [],
      showSourceCodeChanges: true,
      showAssetChanges: true,
      data: {
        commits: [],
      },
    };
    this.commitsDataAdapter = new DataAdapter(this.state.data.commits);
  }

  mapContextValueToView({ branchToColorMapping, classToColorMapping }) {
    return (
      <CommitRangeView
        data={{commits: this.commitsDataAdapter.getFilteredData()}}
        disabledClasses={this.context.disabledClasses}
        applicationName={this.props.applicationName}
        repositoryUrl={this.props.repositoryUrl}
        classToColorMapping={classToColorMapping}
        branchToColorMapping={branchToColorMapping}
        showSourceCodeChanges={this.state.showSourceCodeChanges}
        showAssetChanges={this.state.showAssetChanges}
        offsetLeft={this.props.offsetLeft}
        onDiagramChange={this.props.changeDiagram} />
    );
  }

  resetFilters(filterItems, enableFilter, disableFilter) {
    filterItems.forEach((filterItem) => filterItem.checked ? enableFilter(filterItem.payload) : disableFilter(filterItem.payload));
  }

  toggleAll(filterItems, status) {
    return filterItems.forEach((filterItem) => filterItem.checked = status);
  }

  toggle(filterItems, index) {
    const clickedFilterItem = filterItems[index];
    clickedFilterItem.checked = !clickedFilterItem.checked;
  }

  createFilter(filterId, filterTitle, filterType, isCollapsed, filterItems, filterPredicate, enableFilter, disableFilter) {
    this.commitsDataAdapter.addFilter(filterId, filterPredicate);
    let filterListProps = {
      items: filterItems,
      title: filterTitle,
      withCheckbox: filterType === 'checkbox',
      isRadio: filterType === 'radio',
      collapsed: isCollapsed,
      onBulkChange: (clickedItem) => {
        this.toggleAll(filterListProps.items, clickedItem.checkboxState === 'checked');
        this.resetFilters(filterListProps.items, enableFilter, disableFilter);
        updateItems(filterListProps);
      },
      onItemChange: (clickedItem) => {
        this.toggle(filterListProps.items, clickedItem.index);
        this.resetFilters(filterListProps.items, enableFilter, disableFilter);
        updateItems(filterListProps);
      },
    };
    this.resetFilters(filterListProps.items, enableFilter, disableFilter);
    const updateFilterFunc = this.props.addMenuItem(<ItemList {...filterListProps}/>);
    function updateItems(updatedFilterListProps) {
      filterListProps = {
        ...filterListProps,
        ...updatedFilterListProps,
      };
      updateFilterFunc(<ItemList {...filterListProps}/>);
    }
    return updateItems;
  }
  
  onDataReady(data) {
    const items = [];
    const {
      branchToColorMapping,
      setBranchColor,
      classToColorMapping,
      changeClassColor,
      disableClass,
      enableClass,
      isClassDisabled
    } = this.context;
    this.commitsDataAdapter = new DataAdapter(data.commits);
    const classFilterItems = buildClassFilterItems(data, {
      classToColorMapping,
      isClassDisabled,
    })
      .sort((item1, item2) => item1.label.localeCompare(item2.label));
      classFilterItems.forEach(item => changeClassColor(item.label, item.color));
    
    this.createFilter(
      'classFilter',
      'Class Filter',
      'checkbox',
      false,
      classFilterItems,
      (commit) => commit.changedClasses.length === 0 || commit.changedClasses.some(changedClass => !isClassDisabled(changedClass.className)),
      (payload) => enableClass(payload.className),
      (payload) => disableClass(payload.className),
    );
    const commitHashToBranchFilterMapping = buildBranchFilterItems(data, branchToColorMapping);

    /*let alpahebticallySortedBranchFilterItems = Object.values(commitHashToBranchFilterMapping)
    .sort((item1, item2) => item1.label.localeCompare(item2.label));
    alpahebticallySortedBranchFilterItems.forEach(item => {
      setBranchColor(item.label, item.color);
      item.color = undefined;
    });*/

    this.setState({ data });
    /*this.props.addMenuItem(
      <ItemList items={this.state.branchFilterItems} title='Branch filter' onItemChange={this.handleBranchFilterClick} />
    );*/
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
        <CheckboxItem label='Show commits with source code changes' checked={this.state.showSourceCodeChanges} onItemChange={this.handleContentFilterClick} payload={{filterType: 'src'}} />
        <CheckboxItem label='Show commits with other changes' checked={this.state.showAssetChanges} onItemChange={this.handleContentFilterClick} payload={{filterType: 'asset'}} />
      </ItemList>
    );
    if (this.props.location.state) {
      const data = this.state.data;
      const {
        branchToColorMapping,
        setBranchColor,
        classToColorMapping,
        changeClassColor,
        disableClass,
        enableClass,
        isClassDisabled
      } = this.context;
      const classFilterItems = buildClassFilterItems(data, {
        classToColorMapping,
        isClassDisabled,
      })
      .sort((item1, item2) => item1.label.localeCompare(item2.label));
      classFilterItems.forEach(item => changeClassColor(item.label, item.color));
    
      this.createFilter(
        'classFilter',
        'Class Filter',
        'checkbox',
        false,
        classFilterItems,
        (commit) => commit.changedClasses.length === 0 || commit.changedClasses.some(changedClass => !isClassDisabled(changedClass.className)),
        (payload) => enableClass(payload.className),
        (payload) => disableClass(payload.className),
      );
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.props.location.state) {
      console.log("update nedi");
      const diagramLoader = new DiagramDataLoader();
      console.log(this.props);
      diagramLoader.load(
        this.props.url,
        {
          applicationName: this.props.applicationName,
        }
      )
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
    this.props.location.state = {
      ...this.state,
    };
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
