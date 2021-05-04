const React = require('react');
const ColorContext = require('../contexts/color_context');
const DataAdapter = require('../data_adapter');
const DiagramDataLoader = require('../diagram_data_loader');
const ItemList = require('../item_list');
const CallVolumeDiagram = require('./call_volume_diagram');

class CallVolumeView extends React.Component {
  constructor(props) {
    super(props);
    this.mapContextValueToView = this.mapContextValueToView.bind(this);
    this.handleItemChange = this.handleItemChange.bind(this);
    this.switchCommit = this.switchCommit.bind(this);
    this.classDataAdapter = new DataAdapter([]);
    this.class
    this.state = {
      rawData: {
        classes: [],
      },
      selectedCommit: undefined,
    };
    console.log(props);
  }

  handleItemChange() {

  }

  toggleAll(filterItems, status) {
    return filterItems.forEach((filterItem) => filterItem.checked = status);
  }

  toggle(filterItems, index) {
    const clickedFilterItem = filterItems[index];
    clickedFilterItem.checked = !clickedFilterItem.checked;
  }

  createFilter(filterId, filterTitle, filterType, isCollapsed, filterItems, filterPredicate, enableFilter, disableFilter) {
    this.classDataAdapter.addFilter(filterId, filterPredicate);
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

  resetFilters(filterItems, enableFilter, disableFilter) {
    filterItems.forEach((filterItem) => filterItem.checked ? enableFilter(filterItem.payload) : disableFilter(filterItem.payload));
  }

  mapContextValueToView({ classToColorMapping }) {
    return (
      window.diag = <CallVolumeDiagram
        classes={this.classDataAdapter.getFilteredData()}
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
        this.classDataAdapter.replaceData(rawData.classes);
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
      const classFilterItems = classNames.map((className, index) => ({
        label: className,
        color: this.context.classToColorMapping[className],
        checked: !this.context.isClassDisabled(className),
        payload: {
          className,
        },
      }));
      this.createFilter(
        'classFilter',
        'Class Filter',
        'checkbox',
        false,
        classFilterItems,
        (commitClass) => {
          console.log("is class enabled " + commitClass.className);
          return !this.context.isClassDisabled(commitClass.className);
        },
        (payload) => this.context.enableClass(payload.className),
        (payload) => this.context.disableClass(payload.className),
      );
    })
    .catch(error => console.log(error));
    this.setState({
        selectedCommit: this.props.selectedCommit,
    });
  }

  componentDidUpdate(prevProps, prevState) {
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
