const circleMarginX = 6;
const INITIAL_TRUNK_HEIGHT = 45;
const FLOOR_MARGIN_VERTICAL = 2;
const MINIMUM_CIRCLE_RADIUS = 1;

class CallVolumeDiagramPositioner {
  constructor(classesArray) {
    this.classesArray = classesArray;
    this.trunkHeightCache = new Array(classesArray.length);
    this.branchXCache = new Array(classesArray.length);
    this.trunkXCache = new Array(classesArray.length);
    this.midIndex = Math.floor(classesArray.length / 2);
    this.stemData = new Array(classesArray.length);
    this.centerX = 0;
    for (let i = 0; i < this.stemData.length; i++){
      this.stemData[i] = new Array(this.stemData.length);
    }
  }

  positionBasedProperty(position, valueForEven, valueForOdd) {
    return position % 2 == 0 ? valueForEven : valueForOdd;
  }

  directionY(index) {
    if (this.classesArray.length % 2 == 1 && index == this.midIndex) {
      return 0;
    }
    let result = index < this.midIndex ? this.positionBasedProperty(index, -1, 1) : this.positionBasedProperty(this.classesArray.length-index-1, -1, 1);
    return result;
  }

  directionX(index) {
    if (this.classesArray.length % 2 == 1 && index == this.midIndex) {
      return 0;
    }
    let result = index < this.midIndex ? -1 : 1;
    return result;
  }

  pipeWidth(index) {
    return Math.ceil(Number(this.classesArray[index].totalCallAmount) * 0.25);
  }

  nodeRadius(classIndex, methodIndex) {
    return Math.max(MINIMUM_CIRCLE_RADIUS, Number(this.classesArray[classIndex].methods[methodIndex].totalCallAmount));
  }

  nodeInnerRadius(classIndex, methodIndex) {
    return this.classesArray[classIndex].methods[methodIndex].totalCallAmount > 0 ? 0 : 0.7 * this.nodeRadius(classIndex, methodIndex);
  }

  maxRadius(index) {
    const classData = this.classesArray[index];
    return classData.methods.reduce((maxRadius, method, methodIndex) => Math.max(maxRadius, this.nodeRadius(index, methodIndex)), 0);
  }

  nodePosition(classIndex, methodIndex) {
    const stemPosition = this.stemPosition(classIndex, methodIndex);
    if (this.directionY(classIndex) == 0) {
      if (this.classesArray[classIndex].methods.length == 1) {
        return {
          x: stemPosition.startX + stemPosition.width/2,
          y: stemPosition.startY + 0.9 * stemPosition.height + this.nodeRadius(classIndex, methodIndex),
          outerRadius: this.nodeRadius(classIndex, methodIndex),
          innerRadius: this.nodeInnerRadius(classIndex, methodIndex),
          angle: 360,
        };
      }
      if (this.classesArray[classIndex].methods.length > 0) {
        return {
          x: stemPosition.startX + 0.9 * (stemPosition.width + this.nodeRadius(classIndex, methodIndex)) * (methodIndex % 2 == 0 ? -1 : 1),
          y: stemPosition.startY + stemPosition.height / 2,
          outerRadius: this.nodeRadius(classIndex, methodIndex),
          innerRadius: this.nodeInnerRadius(classIndex, methodIndex),
          angle: 360,
        }
      }
    }
    return {
      x: stemPosition.startX + stemPosition.width / 2 * this.directionX(classIndex),
      y: this.branchStartY(classIndex) + (0.9 * stemPosition.height + this.nodeRadius(classIndex, methodIndex)) * this.directionY(classIndex),
      outerRadius: this.nodeRadius(classIndex, methodIndex),
      innerRadius: this.nodeInnerRadius(classIndex, methodIndex),
      angle: 360,
    };
  }

  stemPosition(classIndex, methodIndex) {
    if (this.stemData[classIndex][methodIndex] !== undefined) {
      return this.stemData[classIndex][methodIndex];
    }
    
    if (methodIndex == 0) {
      if (this.directionX(classIndex) == 0) {
        if (this.classesArray[classIndex].methods.length == 1) {
          this.stemData[classIndex][methodIndex] = {
            startX: this.branchStartX(classIndex),
            startY: this.branchStartY(classIndex),
            width: this.stemWidthFor(classIndex, methodIndex),
            height: this.stemLengthFor(classIndex, methodIndex),
          };
        } else if (this.classesArray[classIndex].methods.length > 0) {
          this.stemData[classIndex][methodIndex] = {
            startX: this.branchStartX(classIndex),
            startY: this.branchStartY(classIndex) + this.nodeRadius(classIndex, methodIndex),
            width: this.stemLengthFor(classIndex, methodIndex),
            height: this.stemWidthFor(classIndex, methodIndex),
            scaleX: -1,
          };
        }
      } else {
        this.stemData[classIndex][methodIndex] = {
          startX: this.branchStartX(classIndex) + (circleMarginX + this.nodeRadius(classIndex, methodIndex)) * this.directionX(classIndex),
          startY: this.branchStartY(classIndex),
          width: this.stemWidthFor(classIndex, methodIndex),
          height: this.stemLengthFor(classIndex, methodIndex),
          scaleX: this.directionX(classIndex),
          scaleY: this.directionY(classIndex),
        };
      }
    } else if (methodIndex > 0) {
      if (this.directionX(classIndex) == 0) {
        this.stemData[classIndex][methodIndex] = {
          startX: this.branchStartX(classIndex) + (methodIndex % 2 == 1 ? + this.pipeWidth(classIndex) : 0),
          startY: (methodIndex == 1 ? this.stemPosition(classIndex, methodIndex-1).startY + FLOOR_MARGIN_VERTICAL : this.stemPosition(classIndex, methodIndex-2).startY + this.stemPosition(classIndex, methodIndex-2).height/2 + this.nodeRadius(classIndex, methodIndex-2) + FLOOR_MARGIN_VERTICAL + this.nodeRadius(classIndex, methodIndex) - this.stemWidthFor(classIndex, methodIndex)/2.0),
          width: this.stemLengthFor(classIndex, methodIndex),
          height: this.stemWidthFor(classIndex, methodIndex),
          scaleX: methodIndex % 2 == 0 ? -1 : 1,
        };
      } else {
        this.stemData[classIndex][methodIndex] = {
          startX: this.stemPosition(classIndex, methodIndex-1).startX + (this.stemPosition(classIndex, methodIndex-1).width / 2.0 + this.nodeRadius(classIndex, methodIndex-1) + 2 * circleMarginX + this.nodeRadius(classIndex, methodIndex) - this.stemWidthFor(classIndex, methodIndex) / 2.0) * this.directionX(classIndex),
          startY: this.branchStartY(classIndex),
          width: this.stemWidthFor(classIndex, methodIndex),
          height: this.stemLengthFor(classIndex, methodIndex),
          scaleX: this.directionX(classIndex),
          scaleY: this.directionY(classIndex),
        };
      }
    }
    return this.stemData[classIndex][methodIndex];
  }

  stemWidthFor(classIndex, methodIndex) {
    return this.stemWidth(this.nodeRadius(classIndex, methodIndex));
  }

  stemWidth(nodeRadius) {
    return Math.ceil(nodeRadius * 0.25);
  }

  stemLengthFor(classIndex, methodIndex) {
    return this.stemLength(this.nodeRadius(classIndex, methodIndex));
  }

  stemLength(nodeRadius) {
    return Math.ceil(nodeRadius * 1.5);
  }

  branchHeight(index) {
    return 2 * this.maxRadius(index) + this.stemLength(this.maxRadius(index));
  }

  maxBranchHeight(index) {
    return this.branchHeight(index) + this.pipeWidth(index);
  }

  trunkAngleCenterX(index) {
    if (this.directionY(index) < 0) {
      if (this.directionX(index) < 0) {
        return this.trunkX(index);
      } else if (this.directionX(index) > 0) {
        return this.trunkX(index) + this.pipeWidth(index);
      }
    }
    if (this.directionY(index) > 0) {
      if (this.directionX(index) < 0) {
        return this.trunkAngleCenterX(index-1);
      }
      if (this.directionX(index) > 0) {
        return this.trunkAngleCenterX(index+1);
      }
    }
  }

  trunkAngleCenterY(index) {
    if (this.directionY(index) < 0) {
      return this.trunkHeight(index);
    }
    if (this.directionY(index) > 0) {
      if (this.directionX(index) < 0) {
        return this.trunkAngleCenterY(index-1);
      }
      if (this.directionX(index) > 0) {
        return this.trunkAngleCenterY(index+1);
      }
    }
  }

  trunkAngleRadius(index) {
    if (this.directionY(index) < 0) {
      return this.pipeWidth(index);
    } else if (this.directionY(index) > 0) {
      if (this.directionX(index) < 0) {
        return this.pipeWidth(index) + this.pipeWidth(index-1);
      } else if (this.directionX(index) > 0) {
        return this.pipeWidth(index) + this.pipeWidth(index+1);
      }
    }
  }

  trunkX(index) {
    if (this.trunkXCache[index] !== undefined) {
      return this.trunkXCache[index];
    }

    if (index == 0) {
      this.trunkXCache[index] = Math.floor(this.centerX - this.classesArray.reduce((sum, classData, classIndex) => sum + this.pipeWidth(classIndex), 0) / 2);
      return this.trunkXCache[index];
    }

    this.trunkXCache[index] = this.trunkX(index-1) + this.pipeWidth(index-1);
    return this.trunkXCache[index];
  }

  trunkHeight(index) {
    if (this.trunkHeightCache[index] !== undefined) {
      return this.trunkHeightCache[index];
    }

    if (index == 0 || index == this.classesArray.length-1) {
      if (this.classesArray.length > 1) {
        this.trunkHeightCache[index] = Math.max(INITIAL_TRUNK_HEIGHT, this.maxBranchHeight(index) + FLOOR_MARGIN_VERTICAL);
      } else if (this.classesArray.length == 1) {
        this.trunkHeightCache[index] = INITIAL_TRUNK_HEIGHT;
      }
      return this.trunkHeightCache[index];
    }

    if (this.directionY(index) < 0) {
      if (this.directionX(index) < 0) {
        this.trunkHeightCache[index] = this.trunkHeight(index-2) + this.pipeWidth(index-2) + this.maxBranchHeight(index-1) + this.maxBranchHeight(index) + FLOOR_MARGIN_VERTICAL;
      } else if (this.directionX(index) > 0) {
        this.trunkHeightCache[index] = this.trunkHeight(index+2) + this.pipeWidth(index+2) + this.maxBranchHeight(index+1) + this.maxBranchHeight(index) + FLOOR_MARGIN_VERTICAL;
      }
    } else if (this.directionY(index) > 0) {
      if (this.directionX(index) < 0) {
        this.trunkHeightCache[index] = this.trunkHeight(index-1);
      } else if (this.directionX(index) > 0) {
        this.trunkHeightCache[index] = this.trunkHeight(index+1);
      }
    } else {
      let leftBranchHeight = this.trunkHeight(index-1) + (this.directionY(index-1) > 0 ? this.maxBranchHeight(index-1) : this.pipeWidth(index-1));
      let rightBranchHeight = this.trunkHeight(index+1) + (this.directionY(index+1) > 0 ? this.maxBranchHeight(index+1) : this.pipeWidth(index+1));
      this.trunkHeightCache[index] = Math.max(leftBranchHeight, rightBranchHeight) + FLOOR_MARGIN_VERTICAL;
    }

    return this.trunkHeightCache[index];
  }

  branchStartY(index) {
    if (this.directionY(index) > 0) {
      if (this.directionX(index) < 0) {
        return this.trunkHeight(index) + this.pipeWidth(index-1) + this.pipeWidth(index);
      }
      if (this.directionX(index) > 0) {
        return this.trunkHeight(index) + this.pipeWidth(index+1) + this.pipeWidth(index);
      }
    }
    return this.trunkHeight(index);
  }

  branchStartX(index) {
    if (this.branchXCache[index] !== undefined) {
      return this.branchXCache[index];
    }

    if (this.directionY(index) < 0) {
      if (this.directionX(index) < 0) {
        this.branchXCache[index] = this.trunkX(index);
      } else if (this.directionX(index) > 0) {
        this.branchXCache[index] = this.trunkX(index) + this.pipeWidth(index);
      }
    } else if (this.directionY(index) > 0) {
      if (this.directionX(index) < 0) {
        this.branchXCache[index] = this.branchStartX(index-1);
      } else if (this.directionX(index) > 0) {
        this.branchXCache[index] = this.branchStartX(index+1);
      }
    } else {
      this.branchXCache[index] = this.trunkX(index);
    }

    return this.branchXCache[index];
  }
}

module.exports = CallVolumeDiagramPositioner;
