class CommitDataManager {
  constructor(rawData) {
    this.rawData = rawData;
    this.isDisabled = {};
  }

  disable(className) {
    this.isDisabled[className] = true;
  }

  enable(className) {
    delete this.isDisabled[className];
  }

  isClassDisabled(className) {
    return (Boolean) (this.isDisabled[className]);
  }

  disableAll() {
    this.rawData.commits
      .flatMap(commit => commit.changedClasses)
      .map(changedClass => changedClass.className)
      .forEach(className => this.disable(className));
  }

  enableAll() {
    this.rawData.commits
      .flatMap(commit => commit.changedClasses)
      .map(changedClass => changedClass.className)
      .forEach(className => this.enable(className));
  }

  getRawCommits() {
    return this.rawData.commits;
  }

  updateData(data) {
    this.rawData = data;
  }
}

module.exports = CommitDataManager;
