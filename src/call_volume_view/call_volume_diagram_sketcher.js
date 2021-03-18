const Konva = require('konva');
const CallVolumeDiagramPositioner = require('./call_volume_diagram_positioner');

const scale = 5;
const circleMarginX = 6;
const circleMarginY = 4;
const strokeWidth = 0;
const pipeAngleRadius = 4;
const floorMargin = 10;
const stemLength = 10;
const stemWidth = 6;
var width = 1600;
var height = 1000;
const centerY = 0;
const marginTop = 0;
const trunkHeight = 45; //todo remove and use INITIAL_TRUNK_HEIGHT
const INITIAL_TRUNK_HEIGHT = 45;
const FLOOR_MARGIN_VERTICAL = 2;
const INIT_STEM_LENGTH = 10;
const floors = [];

class CallVolumeDiagramSketcher {
  constructor(rawData, classToColorMapping) {
    this.rawData = rawData;
    this.classToColorMapping = classToColorMapping;
  }

  convertToVisualizationData(classesArray, stageSize) {
    if (classesArray.length == 0) {
      return [];
    }

    const branches = [];
    const diagramPositioner = new CallVolumeDiagramPositioner(classesArray, stageSize);
    window.diagramPositioner = diagramPositioner;
    for (let i = 0; i < classesArray.length; i++) {
      const classData = classesArray[i];
      const branchData = {
        color: this.classToColorMapping[classData.class],
      };
      const methods = classData.methods.sort((method1, method2) => method1.callAmount - method2.callAmount);
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
      currentPositionX = diagramPositioner.branchStartX(i);
      branchStartingPositionY = diagramPositioner.branchStartY(i);
      let branchStartingPositionX = diagramPositioner.branchStartX(i);
      let directionX = diagramPositioner.directionX(i);
      let directionY = diagramPositioner.directionY(i);
      for ( let m = 0; m < methods.length; m++ ) {
        const method = methods[m];
        leaves.push({
          data: {
            name: method.name,
          },
          stem: {
            type: 'rect',
            color: branchData.color,
            ...diagramPositioner.stemPosition(i, m),
          },
          node: {
            type: 'circle',
            color: branchData.color,
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

  drawBranches(layer, branches) {
    for (let i = 0; i < branches.length; i++) {
      const branchGroup = new Konva.Group();
      layer.add(branchGroup);
      const branch = branches[i];
      for (let pipe of branch.pipes) {
        //console.log(pipe);
        if (pipe.type == 'rect') {
          branchGroup.add(new Konva.Rect({
            x: pipe.startX,
            y: pipe.startY,
            width: pipe.width,
            height: pipe.height,
            fill: pipe.color,
            scaleX: pipe.scaleX,
            scaleY: pipe.scaleY,
          }));
        } else if (pipe.type == 'arc') {
          branchGroup.add(new Konva.Arc({
            x: pipe.centerX,
            y: pipe.centerY,
            innerRadius: pipe.radius - pipe.thickness,
            outerRadius: pipe.radius,
            angle: pipe.angle,
            fill: pipe.color,
            scaleX: pipe.scaleX,
            scaleY: pipe.scaleY,
          }));
        }
      }
      for (let leave of branch.leaves) {
        branchGroup.add(new Konva.Rect({
          x: leave.stem.startX,
          y: leave.stem.startY,
          width: leave.stem.width,
          height: leave.stem.height,
          fill: leave.stem.color,
          scaleX: leave.stem.scaleX,
          scaleY: leave.stem.scaleY,
        }));
        branchGroup.add(new Konva.Circle({
          x: leave.node.centerX,
          y: leave.node.centerY,
          radius: leave.node.radius,
          fill: leave.node.color,
        }));
      }
    }
  }

  draw(stage, selectedCommit) {
    const layer = new Konva.Layer();
    stage.add(layer);
    const branches = this.convertToVisualizationData(
      this.rawData.commits[selectedCommit].classesArray,
      {
        width: stage.width(),
        height: stage.height(),
      },
    );
    
    this.drawBranches(layer, branches);
    layer.add(new Konva.Rect({
      x: 600,
      y: 0,
      width: 1,
      height: 100,
      fill: 'green',
    }));
    for (let i = 0; i < 1000; i++) {
      layer.add(new Konva.Rect({
        x: 602 + i * 0.001 - 0.0001,
        y: 0,
        width: 0.0011,
        height: 100,
        fill: 'green',
      }));
    }
    stage.batchDraw();
  }
}

module.exports = CallVolumeDiagramSketcher;
