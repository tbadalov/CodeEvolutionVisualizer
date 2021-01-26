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
      .forEach(this.disable);
  }

  enableAll() {
    this.rawData.commits
      .flatMap(commit => commit.changedClasses)
      .map(changedClass => changedClass.className)
      .forEach(this.enable);
  }

  getRawCommits() {
    /*const commits = this.rawData.commits
      .map(commit => {
        const changedClasses = commit.changedClasses.filter(changedClass => !this.isClassDisabled(changedClass.className));
        const totalChangedLines = changedClasses.reduce((sum, changedClass) => sum+changedClass.changedLinesCount, 0);
        commit.changedClasses = changedClasses;
        commit.totalChangedLinesCount = totalChangedLines;
        return commit;
      });

    return {
      commits,
    };*/
    return this.rawData.commits;
  }
}

module.exports = CommitDataManager;
