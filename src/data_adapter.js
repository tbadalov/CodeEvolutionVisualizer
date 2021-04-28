class DataAdapter {
  constructor(dataArray) {
    this.dataArray = dataArray;
    this.filtersByIds = {};
  }

  addFilter(filterId, filterPredicate) {
    this.filtersByIds[filterId] = filterPredicate;
  }

  removeFilter(filterId) {
    delete this.filtersByIds[filterId];
  }

  replaceData(dataArray) {
    this.dataArray = dataArray;
  }

  getFilteredData() {
    const filters = Object.values(this.filtersByIds);
    return this.dataArray.filter(element => {
      return filters.reduce((isPassing, filter) => isPassing && filter(element), true);
    });
  }
}

module.exports = DataAdapter;
