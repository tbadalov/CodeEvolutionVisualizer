const constants = require('./constants');
const { largestCommitSize } = require('./util');

export function convertToVisualData(commits, params) {
  const {
    maxHeight,
    isClassDisabled,
    classToColorMapping,
  } = params;
  const maxLines = largestCommitSize(commits);
  const heightPerLine = maxHeight / (maxLines + Math.ceil(constants.EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * maxLines));
  const bars = [];
  for (let index = 0; index < commits.length; index++) {
    const commit = commits[index];
    const barY = maxHeight-constants.BAR_BOTTOM_MARGIN;
    const barX = constants.BAR_LAYER_LEFT_MARGIN + (index) * (constants.BAR_PADDING + constants.BAR_WIDTH);
    const barWidth = constants.BAR_WIDTH;

    const stack = [];
    let currentStackHeight = 0;
    for (let j = 0; j < commit.changedClasses.length; j++) {
      const changedClass = commit.changedClasses[j];

      const stackX = barX;
      const stackY = barY - currentStackHeight;
      const stackHeight = isClassDisabled[changedClass.className] ? 0 : changedClass.changedLinesCount * heightPerLine;
      const stackWidth = barWidth;
      const stackColor = classToColorMapping[changedClass.className];
      const payload = {
        changedLinesCount: changedClass.changedLinesCount,
        changedLinesCountPercentage: changedClass.changedLinesCount / commit.totalChangedLinesCount * 100.0,
        changedClassName: changedClass.className,
        commitHash: commit.commitHash,
      };
      stack.push({
        x: stackX,
        y: stackY,
        height: stackHeight,
        width: stackWidth,
        fill: stackColor,
        scaleY: -1,
        payload: payload,
      });
      currentStackHeight += stackHeight;
    }

    const barHeight = currentStackHeight * heightPerLine;
    const labelPayload = {
      commitDetails: {
        commitMessage: commit.message,
        commitAuthor: commit.author,
        commitTime: commit.time,
        commitBranchName: commit.branchName,
      },
      commitHash: commit.commitHash,
      stacks: stack.map(stackData => stackData.payload),
    };
    const label = {
      text: commit.commitHash.substr(0, Math.min(commit.commitHash.length, 7)),
      rotation: -45,
      x: barX-15,
      y: barY + 35,
      payload: labelPayload,
    }

    bars.push({
      x: barX,
      y: barY,
      height: barHeight,
      width: barWidth,
      label: label,
      stack: stack,
    });
  }
  return {
    bars: bars,
  };
}
