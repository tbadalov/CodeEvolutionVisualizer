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

const classNameColorMapping = {};

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

class BarDataManager {
  constructor(rawData, containerDomElement) {
    this.commitDataManager = new CommitDataManager(rawData);
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

  dataFromRange(xStart, xEnd) {
    const startBarIndex = Math.floor(Math.max(0, (xStart - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const endBarIndex = Math.ceil(Math.max(0, (xEnd - BAR_LAYER_LEFT_MARGIN)) / (BAR_PADDING + BAR_WIDTH));
    const commitsData = this.commitDataManager.getRawCommits();
    /*for (let i = 0; i < 6; i++) {
      segments.push({
        x: axisX - 5,
        y: stageHeight - i * (stageHeight / 5) + 4 / 2,
        width: 10,
        height: 4,
        scaleY: -1,
        label: Math.floor(i * (largestCommitSize + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * largestCommitSize)) / 5),
        full: '#000000',
      })
    }*/
    const heightPerLine = this.calculateStageHeight() / (this.largestCommitSize + Math.ceil(EMPTY_SPACE_TOP_PERCENTAGE / 100.0 * this.largestCommitSize));
    
    const bars = this.commitDataManager.getRawCommits()
      .slice(startBarIndex, endBarIndex)
      .map((commit, index) => {
        const barY = this.calculateStageHeight()-BAR_BOTTOM_MARGIN;
        const barX = BAR_LAYER_LEFT_MARGIN + (startBarIndex + index) * (BAR_PADDING + BAR_WIDTH);
        const barWidth = BAR_WIDTH;

        const stack = [];
        let currentStackHeight = 0;
        for (let j = 0; j < commit.changedClasses.length; j++) {
          const changedClass = commit.changedClasses[j];

          if (this.commitDataManager.isClassDisabled(changedClass.className)) {
            continue;
          }

          if (!classNameColorMapping[changedClass.className]) {
            classNameColorMapping[changedClass.className] = { color: getRandomColor() };
          }

          const stackX = barX;
          const stackY = barY - currentStackHeight;
          const stackHeight = changedClass.changedLinesCount * heightPerLine;
          const stackWidth = barWidth;
          const stackColor = classNameColorMapping[changedClass.className].color;
          stack.push({
            x: stackX,
            y: stackY,
            height: stackHeight,
            width: stackWidth,
            color: stackColor,
            scaleY: -1,
          });
          currentStackHeight += stackHeight;
        }

        const barHeight = currentStackHeight * heightPerLine;

        const label = {
          text: commit.commitHash.substr(0, Math.min(commit.commitHash.length, 7)),
          rotation: -45,
          x: barX-15,
          y: barY + 35,
        }

        return {
          x: barX,
          y: barY,
          height: barHeight,
          width: barWidth,
          label: label,
          stack: stack,
        }
      });
    return {
      bars: bars,
    };
  }

  commitByPosition(x, y) {

  }

  scaleBy(zoomValue) {

  }
}

module.exports = BarDataManager;
