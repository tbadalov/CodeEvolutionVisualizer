const React = require('react');
const SwitchCommitButton = require('./buttons/switch_commit_button');
const PlayButton = require('./buttons/play_button');
const GeneralDiagram = require('../general_diagram');
const { draw, convertToVisualizationData } = require('./call_volume_diagram_sketcher');
const CallVolumeDiagramPositioner = require('./call_volume_diagram_positioner');

let shouldAdaptCamera = true;

function dragBoundary(pos) {
  var newY = Math.min(0, pos.y);
  return {
    x: pos.x,
    y: newY,
  };
}

function calculateSizeOfTheDiagram(visualData, classesArray) {
  if (visualData.length === 1) {
    const width = visualData[0].pipes[0].find(pipe => pipe.type === 'rect').width;
    return {
      totalWidth: width,
      leftWidth: width/2,
      rightWidth: width/2,
      middleWidth: 0,
      totalHeight: visualData[0].pipes.reduce((heightSum, pipe) => pipe.type === 'rect' ? pipe.height : pipe.radius),
    };
  }
  const largestWidthFromLeft = Math.max(
      ...visualData
        .slice(0, Math.floor(visualData.length / 2))
        .map(branch => branch.pipes
            .map(pipe => pipe.type === 'rect' ? pipe.width : pipe.radius)
            .reduce((widthSum, width) => widthSum + width, 0)
         )
  );
  const largestWidthFromRight = Math.max(
    ...visualData
      .slice(Math.floor(visualData.length / 2))
      .map(branch => branch.pipes
        .map(pipe => pipe.type === 'rect' ? pipe.width : pipe.radius)
        .reduce((widthSum, width) => widthSum + width, 0)
      )
  );
  const diagramPositioner = new CallVolumeDiagramPositioner(classesArray);
  const middleWidth = classesArray.reduce((widthSum, classRecord, index) => {
    const classPipeWidth = diagramPositioner.pipeWidth(index);
    return widthSum + classPipeWidth;
  }, 0);
  const totalHeight = Math.max(
    ...visualData
      .map(branch => branch.pipes
          .map(pipe => pipe.type === 'rect' ? pipe.height : pipe.radius)
          .reduce((heightSum, height) => heightSum + height, 0)
      )
  );
  return {
    totalWidth: largestWidthFromLeft + middleWidth + largestWidthFromRight,
    leftWidth: largestWidthFromLeft,
    rightWidth: largestWidthFromRight,
    middleWidth,
    totalHeight,
  };
}

class CallVolumeDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.previousLayerRef = React.createRef();
    this.currentLayerRef = React.createRef();
    this.onWheel = this.onWheel.bind(this);
    this.onSwitchButtonClicked = this.onSwitchButtonClicked.bind(this);
    this.onDraw = this.onDraw.bind(this);
    this.classNameOrder = {};
    this.state = {
      primitiveDiagramProps: {
        stageProps: {
          draggable: true,
          dragBoundFunc: dragBoundary,
          scaleX: 3,
          scaleY: 3,
          width: 0,
          height: 0,
        },
      },
    };
  }

  onDraw() {
    return this.state.shapesToDraw;
  }

  onSwitchButtonClicked(direction) {
    if (direction === 'prev') {
      this.props.switchCommit(this.props.previousCommitHash);
    } else if (direction === 'next') {
      this.props.switchCommit(this.props.nextCommitHash);
    }
  }

  onWheel(e) {
    const scaleBy = 1.03;
    const stage = e.target.getStage();
    var pointer = stage.getPointerPosition();
    var oldScale = stage.scaleX();
    var mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    var newScale =
        e.evt.deltaY > 0 ? oldScale * scaleBy : (e.evt.deltaY < 0 ? oldScale / scaleBy : oldScale);

    var newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    this.setState({
      primitiveDiagramProps: {
        ...this.state.primitiveDiagramProps,
        stageProps: {
          ...this.state.primitiveDiagramProps.stageProps,
          ...dragBoundary(newPos),
          scaleX: newScale,
          scaleY: newScale,
        },
      },
    });
  }

  componentDidMount() {
    // what? ?stage.position(dragBoundary({x: -(stage.width()/2)*stage.scaleX() + this.scrollContainerRef.current.clientWidth / 2, y: stage.y()}));
    console.log(this.scrollContainerRef.current.clientWidth);
    this.setState({
      primitiveDiagramProps: {
        ...this.state.primitiveDiagramProps,
        stageProps: {
          ...this.state.primitiveDiagramProps.stageProps,
          width: this.scrollContainerRef.current.clientWidth,
          height: this.scrollContainerRef.current.clientHeight,
          x: this.scrollContainerRef.current.clientWidth/2,
        },
      },
    });
  }

  removePreviousLayer() {
    this.setState({
      shapesToDraw: this.state.currentLayerShapes,
    });
  }

  isAnimationFinished(prevState) {
    return this.state.isAnimationFinished && this.state.isAnimationFinished !== prevState.isAnimationFinished;
  }

  isDataNotAvailableYet() {
    return this.props.rawData === undefined;
  }

  convertRawDataToVisualShapes(filteredRawData, params) {
    const visualizationData = convertToVisualizationData(filteredRawData, {
      classToColorMapping: this.props.classToColorMapping,
      ...params.visualizationParams,
    });
    const konvaShapes = draw(visualizationData, params.drawParams);
    return konvaShapes;
  }

  buildPreviousCommitLayer(filteredRawData) {
    this.previousLayerRef = React.createRef();
    const prevKonvaShapes = this.convertRawDataToVisualShapes(
      filteredRawData,
      {
        drawParams: {
          layerRef: this.previousLayerRef,
          key: 'prev',
          opacity: 1,
        },
      }
    );
    return prevKonvaShapes;
  }

  buildCurrentCommitLayer(filteredRawData) {
    this.currentLayerRef = React.createRef();
    const currentKonvaShapes = this.convertRawDataToVisualShapes(
      filteredRawData,
      {
        drawParams: {
          layerRef: this.currentLayerRef,
          key: 'current',
          opacity: 0,
        },
      }
    )
    return currentKonvaShapes;
  }

  filterRawData(originalRawData={}) {
    const filteredRawData = (originalRawData.classes || [])
      .filter(classRecord => classRecord.totalCallAmount > 0)
      .map(classRecord => {
        classRecord.methods = classRecord.methods.sort((method1, method2) => method1.totalCallAmount - method2.totalCallAmount);
        return classRecord;
      }).sort((classRecord1, classRecord2) => (classRecord1.totalCallAmount - classRecord2.totalCallAmount)
        || (Math.max(...classRecord1.methods.map(method => method.totalCallAmount))) - Math.max(...classRecord2.methods.map(method => method.totalCallAmount)));

    const relativelySortedRawData = filteredRawData
      .filter(classRecord => this.classNameOrder[classRecord.className] !== undefined)
      .sort((classRecord1, classRecord2) => this.classNameOrder[classRecord1.className] - this.classNameOrder[classRecord2.className]);

    filteredRawData
      .filter(classRecord => this.classNameOrder[classRecord.className] === undefined)
      .forEach(classRecord => {
        relativelySortedRawData.splice(relativelySortedRawData.length % 2 == 0 ? relativelySortedRawData.length/2 : relativelySortedRawData.length/2+1, 0, classRecord);
      });

    this.classNameOrder = relativelySortedRawData
      .reduce((freshMapping, classRecord, index) => {
        freshMapping[classRecord.className] = index;
        return freshMapping;
      }, {});

    return relativelySortedRawData;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.isDataNotAvailableYet()) {
      return;
    }

    if (this.isAnimationFinished(prevState)) {
      this.removePreviousLayer();
    }

    if (this.props.rawData !== prevProps.rawData) {
      console.log(prevProps.rawData);
      const previousLayerData = this.filterRawData(prevProps.rawData);
      const currentLayerData = this.filterRawData(this.props.rawData);
      const currentCommitLayer = this.buildCurrentCommitLayer(currentLayerData);
      const diagramLayers = this.buildPreviousCommitLayer(previousLayerData).concat(currentCommitLayer);
      this.setState({
        shapesToDraw: diagramLayers,
        isAnimationNeeded: true,
        isAnimationFinished: false,
        currentLayerShapes: currentCommitLayer,
      });
      const visualizationData = convertToVisualizationData(currentLayerData, {
        classToColorMapping: this.props.classToColorMapping,
      });
      if (shouldAdaptCamera) {
        this.positionCameraToCenterAtFirstLoad(currentLayerData, visualizationData);
      }
    } else if (this.state.isAnimationNeeded) {
      this.previousLayerRef.current.to({opacity: 0});
      const layerRefAtAnimationStart = this.currentLayerRef;
      this.currentLayerRef.current.to({
        opacity: 1,
        onFinish: () => {
          if (this.currentLayerRef === layerRefAtAnimationStart) {
            this.setState({
              isAnimationNeeded: false,
              isAnimationFinished: true,
            });
          }
        }
      });
    }
  }

  positionCameraToCenterAtFirstLoad(rawData, visualizationData) {
    const diagramSize = calculateSizeOfTheDiagram(visualizationData, rawData);
    const newScale = diagramSize.totalWidth > diagramSize.totalHeight
      ? 0.7 * this.state.primitiveDiagramProps.stageProps.width / diagramSize.totalWidth
      : 0.7 * this.state.primitiveDiagramProps.stageProps.height / diagramSize.totalHeight;
    if (shouldAdaptCamera && this.state.primitiveDiagramProps.stageProps.scaleX !== newScale) {
      this.setState({
        primitiveDiagramProps: {
          ...this.state.primitiveDiagramProps,
          stageProps: {
            ...this.state.primitiveDiagramProps.stageProps,
            scaleX: newScale,
            scaleY: newScale,
            x: this.scrollContainerRef.current.clientWidth/2 - (diagramSize.rightWidth - diagramSize.leftWidth)/2 * newScale,
          },
        },
      });
      shouldAdaptCamera = this.props.rawData.classes.length === 0;
    }
  }

  render() {
    return(
      <GeneralDiagram {...this.state}
        onWheel={this.onWheel}
        scrollContainerRef={this.scrollContainerRef}
        onDraw={this.onDraw}>
        { this.props.previousCommitHash ? <SwitchCommitButton direction='prev' onSwitchCommitButtonClick={this.onSwitchButtonClicked} /> : null }
        { this.props.nextCommitHash ? <SwitchCommitButton direction='next' onSwitchCommitButtonClick={this.onSwitchButtonClicked} /> : null }
        <PlayButton />
      </GeneralDiagram>
    );
  }
}

module.exports = CallVolumeDiagram;
