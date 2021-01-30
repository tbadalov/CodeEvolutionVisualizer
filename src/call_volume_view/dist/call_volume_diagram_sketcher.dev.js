"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Konva = require('konva');

var CallVolumeDiagramPositioner = require('./call_volume_diagram_positioner');

var scale = 5;
var circleMarginX = 6;
var circleMarginY = 4;
var strokeWidth = 0;
var pipeAngleRadius = 4;
var floorMargin = 10;
var stemLength = 10;
var stemWidth = 6;
var width = 1600;
var height = 1000;
var centerY = 0;
var marginTop = 0;
var trunkHeight = 45; //todo remove and use INITIAL_TRUNK_HEIGHT

var INITIAL_TRUNK_HEIGHT = 45;
var FLOOR_MARGIN_VERTICAL = 2;
var INIT_STEM_LENGTH = 10;
var floors = [];

var CallVolumeDiagramSketcher =
/*#__PURE__*/
function () {
  function CallVolumeDiagramSketcher(rawData, classToColorMapping) {
    _classCallCheck(this, CallVolumeDiagramSketcher);

    this.rawData = rawData;
    this.classToColorMapping = classToColorMapping;
  }

  _createClass(CallVolumeDiagramSketcher, [{
    key: "convertToVisualizationData",
    value: function convertToVisualizationData(classesArray, stageSize) {
      if (classesArray.length == 0) {
        return [];
      }

      var branches = [];
      var diagramPositioner = new CallVolumeDiagramPositioner(classesArray, stageSize);
      window.diagramPositioner = diagramPositioner;

      for (var i = 0; i < classesArray.length; i++) {
        var classData = classesArray[i];
        var branchData = {
          color: this.classToColorMapping[classData["class"]]
        };
        var methods = classData.methods.sort(function (method1, method2) {
          return method1.callAmount - method2.callAmount;
        });
        var pipes = [{
          type: 'rect',
          startX: diagramPositioner.trunkX(i),
          startY: marginTop,
          height: diagramPositioner.trunkHeight(i),
          width: diagramPositioner.pipeWidth(i),
          color: branchData.color
        }];
        var leaves = [];
        currentPositionX = diagramPositioner.branchStartX(i);
        branchStartingPositionY = diagramPositioner.branchStartY(i);
        var branchStartingPositionX = diagramPositioner.branchStartX(i);
        var directionX = diagramPositioner.directionX(i);
        var directionY = diagramPositioner.directionY(i);

        for (var m = 0; m < methods.length; m++) {
          var method = methods[m];
          leaves.push({
            data: {
              name: method.name
            },
            stem: _objectSpread({
              type: 'rect',
              color: branchData.color
            }, diagramPositioner.stemPosition(i, m)),
            node: _objectSpread({
              type: 'circle',
              color: branchData.color
            }, diagramPositioner.nodePosition(i, m))
          });
        }

        if (diagramPositioner.directionY(i) == 0) {
          pipes.push({
            type: 'rect',
            startX: diagramPositioner.branchStartX(i),
            startY: diagramPositioner.branchStartY(i),
            width: diagramPositioner.pipeWidth(i),
            height: diagramPositioner.stemPosition(i, methods.length - 1).startY - diagramPositioner.branchStartY(i),
            color: branchData.color,
            scaleY: 1
          });
          pipes.push({
            type: 'arc',
            thickness: diagramPositioner.stemWidthFor(i, methods.length - 1),
            radius: diagramPositioner.stemWidthFor(i, methods.length - 1),
            centerX: diagramPositioner.stemPosition(i, methods.length - 1).startX,
            centerY: diagramPositioner.stemPosition(i, methods.length - 1).startY,
            angle: 90,
            color: branchData.color,
            scaleX: -1 * ((methods.length - 1) % 2 == 0 ? -1 : 1) * (diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length - 1))),
            // 1 to draw arc to left, -1 to draw to right
            scaleY: 1
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
            scaleX: -1 * diagramPositioner.directionX(i) // 1 to draw arc to left, -1 to draw to right

          });
          pipes.push({
            type: 'rect',
            startX: diagramPositioner.branchStartX(i),
            startY: diagramPositioner.branchStartY(i),
            width: (diagramPositioner.stemPosition(i, methods.length - 1).startX - branchStartingPositionX) * diagramPositioner.directionX(i),
            height: diagramPositioner.pipeWidth(i),
            color: branchData.color,
            scaleX: diagramPositioner.directionX(i),
            scaleY: -1 * diagramPositioner.directionY(i)
          });
          pipes.push({
            type: 'arc',
            thickness: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length - 1)),
            radius: diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length - 1)),
            centerX: diagramPositioner.stemPosition(i, methods.length - 1).startX,
            centerY: diagramPositioner.branchStartY(i),
            angle: 90,
            color: branchData.color,
            scaleX: diagramPositioner.directionX(i),
            // 1 to draw arc to left, -1 to draw to right
            scaleY: -(diagramPositioner.pipeWidth(i) / diagramPositioner.stemWidth(diagramPositioner.nodeRadius(i, methods.length - 1))) * diagramPositioner.directionY(i)
          });
        }

        branches.push({
          data: branchData,
          pipes: pipes,
          leaves: leaves
        });
      }

      return branches;
    }
  }, {
    key: "drawBranches",
    value: function drawBranches(layer, branches) {
      for (var i = 0; i < branches.length; i++) {
        var branchGroup = new Konva.Group();
        layer.add(branchGroup);
        var branch = branches[i];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = branch.pipes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var pipe = _step.value;

            //console.log(pipe);
            if (pipe.type == 'rect') {
              branchGroup.add(new Konva.Rect({
                x: pipe.startX,
                y: pipe.startY,
                width: pipe.width,
                height: pipe.height,
                fill: pipe.color,
                scaleX: pipe.scaleX,
                scaleY: pipe.scaleY
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
                scaleY: pipe.scaleY
              }));
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = branch.leaves[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var leave = _step2.value;
            branchGroup.add(new Konva.Rect({
              x: leave.stem.startX,
              y: leave.stem.startY,
              width: leave.stem.width,
              height: leave.stem.height,
              fill: leave.stem.color,
              scaleX: leave.stem.scaleX,
              scaleY: leave.stem.scaleY
            }));
            branchGroup.add(new Konva.Circle({
              x: leave.node.centerX,
              y: leave.node.centerY,
              radius: leave.node.radius,
              fill: leave.node.color
            }));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    }
  }, {
    key: "draw",
    value: function draw(stage, selectedCommit) {
      var layer = new Konva.Layer();
      stage.add(layer);
      var branches = this.convertToVisualizationData(this.rawData.commits[selectedCommit].classesArray, {
        width: stage.width() / stage.scaleX(),
        height: stage.height() / stage.scaleX()
      });
      this.drawBranches(layer, branches);
      layer.draw();
    }
  }]);

  return CallVolumeDiagramSketcher;
}();

module.exports = CallVolumeDiagramSketcher;