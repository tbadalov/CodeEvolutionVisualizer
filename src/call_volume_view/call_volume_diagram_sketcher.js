const React = require('react');
const ReactKonva = require('react-konva');
const CallVolumeDiagramPositioner = require('./call_volume_diagram_positioner');
const EMPTY_CLASS_STROKE_WIDTH = 0.2;

const marginTop = 0;
export function convertToVisualizationData(classesArray, params) {
  const {
    classToColorMapping,
  } = params;
  console.log("converting to visualization data");
  console.log(classesArray);
  const branches = [];
  const diagramPositioner = new CallVolumeDiagramPositioner(classesArray);
  window.diagramPositioner = diagramPositioner;
  for (let i = 0; i < classesArray.length; i++) {
    const classData = classesArray[i];
    const branchData = {
      color: classToColorMapping[classData.className],
      className: classData.className,
      isFocusOn: params.isFocusOn,
      isFocused: params.isClassFocused[classData.className],
    };
    //const methods = classData.methods.sort((method1, method2) => method1.totalCallAmount - method2.totalCallAmount);
    const methods = classData.methods;
    const pipes = [
      {
        type: 'rect',
        startX: diagramPositioner.trunkX(i),
        startY: marginTop,
        height: diagramPositioner.trunkHeight(i),
        width: diagramPositioner.pipeWidth(i),
        color: branchData.color,
      },
    ];
    if (Number(classData.totalCallAmount) === 0) {
      pipes.push({
        type: 'rect',
        startX: diagramPositioner.trunkX(i) + diagramPositioner.emptyPipeStrokeWidth(),
        startY: marginTop,
        height: diagramPositioner.trunkHeight(i) + (classData.methods.length === 0 ? - 1 : 1) * diagramPositioner.emptyPipeStrokeWidth(),
        width: diagramPositioner.pipeWidth(i)-diagramPositioner.emptyPipeStrokeWidth()*2,
        color: '#f0f0f0',
      });
    }
    console.log("pipes for " + classData.className);
    console.log(pipes);
    const leaves = [];
    let branchStartingPositionX = diagramPositioner.branchStartX(i);
    for ( let m = 0; m < methods.length; m++ ) {
      const method = methods[m];
      const leaf = {
        data: {
          name: method.methodName,
        },
        stem: {
          type: 'rect',
          fill: branchData.color,
          ...diagramPositioner.stemPosition(i, m),
        },
        node: {
          type: 'arc',
          fill: branchData.color,
          ...diagramPositioner.nodePosition(i, m),
        },
      };
      if (Number(method.totalCallAmount) === 0) {
        const emptyMethodStrokeWidth = diagramPositioner.nodeRadius(i, m) - diagramPositioner.nodeInnerRadius(i, m);
        leaf.stemFillerForEmptyMethod = {
          type: 'rect',
          fill: '#f0f0f0',
          startX: diagramPositioner.directionX(i) !== 0 ? leaf.stem.startX + diagramPositioner.directionX(i) * emptyMethodStrokeWidth : classData.methods.length > 1 ? leaf.stem.startX : leaf.stem.startX + diagramPositioner.emptyPipeStrokeWidth(),
          startY: diagramPositioner.directionY(i) !== 0 ? leaf.stem.startY - (Number(classData.totalCallAmount) === 0 && m < classData.methods.length-1 ? diagramPositioner.directionY(i) * diagramPositioner.emptyPipeStrokeWidth() : 0) : classData.methods.length > 1 ? leaf.stem.startY + emptyMethodStrokeWidth : leaf.stem.startY,
          width: diagramPositioner.directionX(i) !== 0 ? leaf.stem.width - 2 * emptyMethodStrokeWidth : classData.methods.length > 1 ? leaf.stem.width + emptyMethodStrokeWidth : leaf.stem.width - diagramPositioner.emptyPipeStrokeWidth() * 2,
          height: diagramPositioner.directionY(i) !== 0 ? leaf.stem.height + emptyMethodStrokeWidth*2 : classData.methods.length > 1 ? leaf.stem.height - 2 * emptyMethodStrokeWidth : leaf.stem.height + diagramPositioner.emptyPipeStrokeWidth(),
          scaleX: leaf.stem.scaleX,
          scaleY: leaf.stem.scaleY,
        };
      }
      leaves.push(leaf);
    }
    if (classData.methods.length > 0) {
      if (diagramPositioner.directionY(i) == 0) {
        pipes.push({
          type: 'rect',
          startX: diagramPositioner.branchStartX(i),
          startY: diagramPositioner.branchStartY(i),
          width: diagramPositioner.pipeWidth(i),
          height: diagramPositioner.stemPosition(i, methods.length-1).startY - diagramPositioner.branchStartY(i),
          color: branchData.color,
          scaleY: 1,
        });
        pipes.push({
          type: 'arc',
          thickness: diagramPositioner.stemWidthFor(i, methods.length-1),
          radius: diagramPositioner.stemWidthFor(i, methods.length-1),
          centerX: diagramPositioner.stemPosition(i, methods.length-1).startX,
          centerY: diagramPositioner.stemPosition(i, methods.length-1).startY,
          angle: 90,
          color: branchData.color,
          scaleX: -1 * ((methods.length-1) % 2 == 0 ? -1 : 1) * (diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))), // 1 to draw arc to left, -1 to draw to right
          scaleY: 1,
        });
        if (Number(classData.totalCallAmount) === 0) {
          pipes.push({
            type: 'rect',
            startX: diagramPositioner.branchStartX(i)+diagramPositioner.emptyPipeStrokeWidth(),
            startY: diagramPositioner.branchStartY(i),
            width: diagramPositioner.pipeWidth(i)-diagramPositioner.emptyPipeStrokeWidth() * 2,
            height: diagramPositioner.stemPosition(i, methods.length-1).startY - diagramPositioner.branchStartY(i),
            color: '#f0f0f0',
            scaleY: 1,
          });
          pipes.push({
            type: 'arc',
            thickness: diagramPositioner.stemWidthFor(i, methods.length-1) - diagramPositioner.emptyPipeStrokeWidth() * 2,
            radius: diagramPositioner.stemWidthFor(i, methods.length-1) - diagramPositioner.emptyPipeStrokeWidth(),
            centerX: diagramPositioner.stemPosition(i, methods.length-1).startX,
            centerY: diagramPositioner.stemPosition(i, methods.length-1).startY,
            angle: 90,
            color: '#f0f0f0',
            scaleX: -1 * ((methods.length-1) % 2 == 0 ? -1 : 1) * (diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))), // 1 to draw arc to left, -1 to draw to right
            scaleY: 1,
          });
        }
      } else {
        pipes.push({
          type: 'arc',
          thickness: diagramPositioner.pipeWidth(i),
          radius: diagramPositioner.trunkAngleRadius(i),
          centerX: diagramPositioner.trunkAngleCenterX(i),
          centerY: diagramPositioner.trunkAngleCenterY(i),
          angle: 90,
          color: branchData.color,
          scaleX: -1 * diagramPositioner.directionX(i), // 1 to draw arc to left, -1 to draw to right
        });
        pipes.push({
          type: 'rect',
          startX: diagramPositioner.branchStartX(i),
          startY: diagramPositioner.branchStartY(i),
          width: (diagramPositioner.stemPosition(i, methods.length-1).startX - branchStartingPositionX) * diagramPositioner.directionX(i),
          height: diagramPositioner.pipeWidth(i),
          color: branchData.color,
          scaleX: diagramPositioner.directionX(i),
          scaleY: -1 * diagramPositioner.directionY(i),
        });
        pipes.push({
          type: 'arc',
          thickness: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1)),
          radius: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1)),
          centerX: diagramPositioner.stemPosition(i, methods.length-1).startX,
          centerY: diagramPositioner.branchStartY(i),
          angle: 90,
          color: branchData.color,
          scaleX: diagramPositioner.directionX(i), // 1 to draw arc to left, -1 to draw to right
          scaleY: -(diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))) * diagramPositioner.directionY(i),
        });
        if (Number(classData.totalCallAmount) === 0) {
          pipes.push({
            type: 'arc',
            thickness: diagramPositioner.pipeWidth(i) - diagramPositioner.emptyPipeStrokeWidth() * 2,
            radius: diagramPositioner.trunkAngleRadius(i)-diagramPositioner.emptyPipeStrokeWidth(),
            centerX: diagramPositioner.trunkAngleCenterX(i),
            centerY: diagramPositioner.trunkAngleCenterY(i),
            angle: 90,
            color: '#f0f0f0',
            scaleX: -1 * diagramPositioner.directionX(i), // 1 to draw arc to left, -1 to draw to right
          });
          pipes.push({
            type: 'rect',
            startX: diagramPositioner.branchStartX(i),
            startY: diagramPositioner.branchStartY(i) - diagramPositioner.emptyPipeStrokeWidth()*diagramPositioner.directionY(i),
            width: (diagramPositioner.stemPosition(i, methods.length-1).startX - branchStartingPositionX) * diagramPositioner.directionX(i),
            height: diagramPositioner.pipeWidth(i)-diagramPositioner.emptyPipeStrokeWidth()*2,
            color: '#f0f0f0',
            scaleX: diagramPositioner.directionX(i),
            scaleY: -1 * diagramPositioner.directionY(i),
          });
          pipes.push({
            type: 'arc',
            thickness: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))-diagramPositioner.emptyPipeStrokeWidth()*2,
            radius: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))-diagramPositioner.emptyPipeStrokeWidth(),
            centerX: diagramPositioner.stemPosition(i, methods.length-1).startX,
            centerY: diagramPositioner.branchStartY(i),
            angle: 90,
            color: '#f0f0f0',
            scaleX: diagramPositioner.directionX(i), // 1 to draw arc to left, -1 to draw to right
            scaleY: -(diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length-1))) * diagramPositioner.directionY(i),
          });
        }
      }
    }
    branches.push({
      data: branchData,
      pipes: pipes,
      leaves: leaves,
    });
  }
  return branches;
}

function drawBranches(branches) {
  const branchKonvaShapes = [];
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const currentBranchPipeShapes = branch.pipes.map((pipe, index) => {
      if (pipe.type === 'rect') {
        const pipeProps = {
          x: pipe.startX,
          y: pipe.startY,
          width: pipe.width,
          height: pipe.height,
          fill: pipe.color,
          scaleX: pipe.scaleX,
          scaleY: pipe.scaleY,
        };
        return (
          <ReactKonva.Rect key={`pipe-${index}-of-branch-${i}`} {...pipeProps} />
        );
      } else if (pipe.type == 'arc') {
        const pipeCornerProps = {
          x: pipe.centerX,
          y: pipe.centerY,
          innerRadius: pipe.radius - pipe.thickness,
          outerRadius: pipe.radius,
          angle: pipe.angle,
          fill: pipe.color,
          scaleX: pipe.scaleX,
          scaleY: pipe.scaleY,
        };
        return (
          <ReactKonva.Arc {...pipeCornerProps} key={`corner-${index}-of-branch-${i}`} />
        );
      }
    });
    const currentBranchLeafShapes = branch.leaves.map((leave, index) => {
      const leaveProps = {
        x: leave.stem.startX,
        y: leave.stem.startY,
        width: leave.stem.width,
        height: leave.stem.height,
        fill: leave.stem.fill,
        scaleX: leave.stem.scaleX,
        scaleY: leave.stem.scaleY,
      };

      const stemFillerForEmptyMethod = {};
      if (leave.stemFillerForEmptyMethod) {
        Object.assign(stemFillerForEmptyMethod, {
          x: leave.stemFillerForEmptyMethod.startX,
          y: leave.stemFillerForEmptyMethod.startY,
          width: leave.stemFillerForEmptyMethod.width,
          height: leave.stemFillerForEmptyMethod.height,
          fill: '#f0f0f0',
          scaleX: leave.stemFillerForEmptyMethod.scaleX,
          scaleY: leave.stemFillerForEmptyMethod.scaleY,
        });
        if (isNaN(stemFillerForEmptyMethod.x)) {
          console.log("NaN detected stem filler");
          console.log(stemFillerForEmptyMethod);
        }
      }
      return (
        <ReactKonva.Group key={`leaf-${index}-of-branch-${i}`}>
          <ReactKonva.Rect {...leaveProps} />
          <ReactKonva.Arc {...leave.node} />
          { leave.stemFillerForEmptyMethod ? <ReactKonva.Rect {...stemFillerForEmptyMethod} /> : null }
        </ReactKonva.Group>
      );
    });
    branchKonvaShapes.push(
      <ReactKonva.Group key={`branch-${i}`}
        opacity={branch.data.isFocusOn && branch.data.isFocused ? 0.5 : 1.0}
      >
        { currentBranchPipeShapes }
        { currentBranchLeafShapes }
      </ReactKonva.Group>
    );
  }
  return branchKonvaShapes;
}

export function draw(visualData, params) {
  const {
    layerRef,
    opacity,
    key
  } = params;
  console.log(params);
  const branchKonvaShapes = drawBranches(visualData);
  return [
    <ReactKonva.Layer
      key={`${key}-call-volume-layer`}
      opacity={opacity}
      ref={layerRef}>
      { branchKonvaShapes }
    </ReactKonva.Layer>
  ];
}
