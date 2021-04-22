const constants = require('./constants');

export function convertToVisualData(params) {
  const {
    commits,
    maxHeight,
    isClassDisabled,
    classToColorMapping,
    largestCommitSize,
    scrollLeft,
  } = params;
  const maxLines = largestCommitSize;
  const heightPerLine = maxHeight / (maxLines + Math.ceil(constants.EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * maxLines));
  const bars = [];
  const m = constants.BAR_LAYER_LEFT_MARGIN,
        s = scrollLeft,
        p = constants.BAR_PADDING,
        w = constants.BAR_WIDTH;
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const barY = maxHeight-constants.BAR_BOTTOM_MARGIN;
    // m - margin, s - scroll position, p - bar padding, w - bar width
    const initialOffset = m - s; // margin is getting shrinked down while we scroll to the right
    const relativePositionWithinBarAndItsPadding = (s-m) % (w+p);
    const offsetWhileLeftmostBarIsVisible = -relativePositionWithinBarAndItsPadding;
    const offsetWhileLeftmostBarIsOutOfScreen = relativePositionWithinBarAndItsPadding - w;
    const regularOffset = relativePositionWithinBarAndItsPadding < w ? offsetWhileLeftmostBarIsVisible : offsetWhileLeftmostBarIsOutOfScreen;
    const offset = s < m ? initialOffset : regularOffset;
    // barX = i * (p+w) + (s < m ? m-s : ((s-m) % (w+p) < w ? -(s-m) % (w+p) : (s-m) % (w+p) - w));
    const barX = i * (p+w) + offset;

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
      const strokeColor = commit.commitHash === params.strokedStackCommitHash && changedClass.className === params.strokedStackClassName ? params.strokedStackBorderColor : undefined;
      const stackData = {
        x: stackX,
        y: stackY,
        height: stackHeight,
        width: stackWidth,
        fill: stackColor,
        scaleY: -1,
        payload: payload,
        stroke: strokeColor,
      };
      stack.push(stackData);
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
