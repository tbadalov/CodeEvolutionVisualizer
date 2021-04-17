const CommitDataManager = require('./commit_data_manager');
const { largestCommitSize } = require('./util');

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
  constructor(rawData, classToColorMapping, containerReference) {
    this.commitDataManager = new CommitDataManager(rawData);
    this.classToColorMapping = classToColorMapping;
    this.containerReference = containerReference;
    this.largestCommitSize = largestCommitSize(this.commitDataManager.getRawCommits());
    this.zoomValueY = 1.0;
    this.zoomValueX = 1.0;
    this.showSrc = true;
    this.showAssets = true;
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
    return this.containerReference.current.clientHeight;
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
    this.largestCommitSize = largestCommitSize(commits);
  }

  dataFromRange(xStart, xEnd) {
    const startBarIndex = Math.floor(Math.max(0, (xStart - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const endBarIndex = Math.ceil(Math.max(0, (xEnd - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const commits = this.commitDataManager.getRawCommits();
    return commits.slice(startBarIndex, endBarIndex+1)
      .filter(commit => (this.showSrc && commit.totalChangedLinesCount > 0) || (this.showAssets && commit.totalChangedLinesCount === 0));
  }

  updateUnderlyingData(data, classToColorMapping) {
    this.commitDataManager.updateData(data);
    this.classToColorMapping = classToColorMapping;
    this.largestCommitSize = this.commitDataManager.getRawCommits().reduce((max, commit) => Math.max(max, commit.totalChangedLinesCount), 0);
  }

  showSourceCodeChanges(value) {
    this.showSrc = value;
  }

  showAssetChanges(value) {
    this.showAssets = value;
  }
}

module.exports = BarDataManager;
