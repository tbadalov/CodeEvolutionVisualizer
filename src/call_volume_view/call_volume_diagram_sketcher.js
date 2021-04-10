const React = require('react');
const ReactKonva = require('react-konva');
const CallVolumeDiagramPositioner = require('./call_volume_diagram_positioner');

const marginTop = 0;
export function convertToVisualizationData(
  classesArray,
  {
    classToColorMapping,
  }
) {
  if (classesArray.length == 0) {
    return [];
  }

  const branches = [];
  const diagramPositioner = new CallVolumeDiagramPositioner(classesArray);
  window.diagramPositioner = diagramPositioner;
  for (let i = 0; i < classesArray.length; i++) {
    const classData = classesArray[i];
    const branchData = {
      color: classToColorMapping[classData.className],
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
    const leaves = [];
    let branchStartingPositionX = diagramPositioner.branchStartX(i);
    for ( let m = 0; m < methods.length; m++ ) {
      const method = methods[m];
      leaves.push({
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

      });
    }
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
      return (
        <ReactKonva.Group key={`leaf-${index}-of-branch-${i}`}>
          <ReactKonva.Rect {...leaveProps} />
          <ReactKonva.Arc {...leave.node} />
        </ReactKonva.Group>
      );
    });
    branchKonvaShapes.push(
      <ReactKonva.Group key={`branch-${i}`}>
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
