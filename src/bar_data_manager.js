const CommitDataManager = require('./commit_data_manager');

const BAR_WIDTH = 30;
const BAR_PADDING = 2;
const BAR_LAYER_LEFT_MARGIN = 40;
const Y_AXIS_WIDTH = 100;
const Y_AXIS_LINE_WIDTH = 6;
const LABEL_HEIGHT = 40;
const BAR_BOTTOM_MARGIN = LABEL_HEIGHT + 5;
const PADDING = 250;
const EMPTY_SPACE_TOP_PERCENTAGE = 10;
const AXIS_SEGMENT_COUNT = 5;

class BarDataManager {
  constructor(rawData, classToColorMapping, containerDomElement) {
    this.commitDataManager = new CommitDataManager(rawData);
    this.classToColorMapping = classToColorMapping;
    this.containerDomElement = containerDomElement;
    this.largestCommitSize = this.commitDataManager.getRawCommits().reduce((max, commit) => Math.max(max, commit.totalChangedLinesCount), 0);
    this.zoomValueY = 1.0;
    this.zoomValueX = 1.0;
  }

  disable(className) {
    this.commitDataManager.disable(className);
  }

  enable(className) {
    this.commitDataManager.enable(className);
  }

  disableAll() {
    this.commitDataManager.disableAll();
  }

  enableAll() {
    this.commitDataManager.enableAll();
  }

  /* the height has to be used after the width of a stage is assigned because of an appearing scrollbar */
  calculateStageHeight() {
    return this.containerDomElement.clientHeight;
  }

  calculateStageWidth() {
    return BAR_LAYER_LEFT_MARGIN + this.commitDataManager.getRawCommits().length * (BAR_WIDTH + BAR_PADDING);
  }

  axisData() {
    const axisX = (Y_AXIS_WIDTH - Y_AXIS_LINE_WIDTH) / 2;
    const axisY = this.calculateStageHeight()-BAR_BOTTOM_MARGIN
    const axisWidth = Y_AXIS_LINE_WIDTH;
    const axisHeight = this.calculateStageHeight()-BAR_BOTTOM_MARGIN;
    const segments = [];
    for (let i = 0; i < AXIS_SEGMENT_COUNT+1; i++) {
      segments.push({
        x: axisX - 5,
        y: this.calculateStageHeight() - BAR_BOTTOM_MARGIN - i * ((this.calculateStageHeight()-BAR_BOTTOM_MARGIN) / AXIS_SEGMENT_COUNT) + 4 / 2,
        width: 10,
        height: 4,
        scaleY: -1,
        label: Math.floor(i * (this.largestCommitSize + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * this.largestCommitSize)) / AXIS_SEGMENT_COUNT),
        fill: '#000000',
      })
    }

    return {
      line: {
        x: axisX,
        y: axisY,
        width: axisWidth,
        height: axisHeight,
        scaleY: -1,
        fill: '#000000',
      },
      segments: segments,
    };
  }

  barsFromRange(xStart, xEnd) {
    const startBarIndex = Math.floor(Math.max(0, (xStart - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const commits = this.dataFromRange(xStart, xEnd);
    const heightPerLine = this.calculateStageHeight() / (this.largestCommitSize + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * this.largestCommitSize));
    const bars = [];
    for (let index = 0; index < commits.length; index++) {
      const commit = commits[index];
      const barY = this.calculateStageHeight()-BAR_BOTTOM_MARGIN;
      const barX = BAR_LAYER_LEFT_MARGIN + (index+startBarIndex) * (BAR_PADDING + BAR_WIDTH);
      const barWidth = BAR_WIDTH;

      const stack = [];
      let currentStackHeight = 0;
      for (let j = 0; j < commit.changedClasses.length; j++) {
        const changedClass = commit.changedClasses[j];

        if (this.commitDataManager.isClassDisabled(changedClass.className)) {
          continue;
        }

        const stackX = barX;
        const stackY = barY - currentStackHeight;
        const stackHeight = changedClass.changedLinesCount * heightPerLine;
        const stackWidth = barWidth;
        const stackColor = this.classToColorMapping[changedClass.className];
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
          color: stackColor,
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

  dataFromRange(xStart, xEnd) {
    const startBarIndex = Math.floor(Math.max(0, (xStart - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const endBarIndex = Math.ceil(Math.max(0, (xEnd - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const commits = this.commitDataManager.getRawCommits();
    return commits.slice(startBarIndex, endBarIndex+1);
  }

  commitByPosition(x, y) {

  }

  scaleBy(zoomValue) {

  }
}

module.exports = BarDataManager;
