const constants = require('./constants');

export function calculateLargestCommitSize(commits, params = {}) {
  const isClassDisabled = params.isClassDisabled || {};
  return commits
    .map(commit => commit.changedClasses)
    .map(changedClassesInCommit => changedClassesInCommit.filter(changedClass => !isClassDisabled[changedClass.className]))
    .map(filteredChangedClassesInCommit => filteredChangedClassesInCommit.reduce((sum, changedClass) => sum+changedClass.changedLinesCount, 0))
    .reduce((max, totalChangedLinesCount) => Math.max(max, totalChangedLinesCount), 0);
}
