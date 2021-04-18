const constants = require('./constants');

export function calculateLargestCommitSize(commits, params = {}) {
  const isClassDisabled = params.isClassDisabled || {};
  return commits
    .map(commit => commit.changedClasses)
    .map(changedClassesInCommit => changedClassesInCommit.filter(changedClass => !isClassDisabled[changedClass.className]))
    .map(filteredChangedClassesInCommit => filteredChangedClassesInCommit.reduce((sum, changedClass) => sum+changedClass.changedLinesCount, 0))
    .reduce((max, totalChangedLinesCount) => Math.max(max, totalChangedLinesCount), 0);
}

export function dataFromRange(commits, params) {
  const offset = params.offset || 0;
  const startX = Math.max(0, params.startX-constants.BAR_LAYER_LEFT_MARGIN-offset);
  const endX = Math.max(0, params.endX-constants.BAR_LAYER_LEFT_MARGIN-offset);
  if (startX >= endX) {
    return [];
  }

  const startBarIndex = Math.floor((startX+constants.BAR_PADDING) / (constants.BAR_WIDTH+constants.BAR_PADDING));
  const endBarIndex = Math.ceil(endX / (constants.BAR_PADDING+constants.BAR_WIDTH));

  return commits.slice(startBarIndex, endBarIndex);
}

export function calculateStageWidth(commits) {
  return constants.BAR_LAYER_LEFT_MARGIN + commits.length * (constants.BAR_WIDTH + constants.BAR_PADDING);
}
