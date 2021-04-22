const React = require('react');
const ReactKonva = require('react-konva');

function drawStack(stack, params) {
  const rectProps = {
    ...stack,
    onMouseEnter: params.onMouseEnter,
    onMouseMove: params.onMouseMove,
    onMouseLeave: params.onMouseLeave,
  };

  return <ReactKonva.Rect {...rectProps} />;
}

function drawLabel(label, params) {
  const textProps = {
    text: label.text,
    x: label.x,
    y: label.y,
    rotation: label.rotation,
    onMouseEnter: params.onLabelMouseEnter,
    onMouseLeave: params.onLabelMouseLeave,
    onClick: params.onLabelClick,
  };
  /*
  onClick: function (e) {
      console.log(e);
      onLabelClick(label.payload.commitHash, label.payload.stacks.map(stackPayload => stackPayload.changedClassName));
    },*/
  return <ReactKonva.Text {...textProps} />
}

function labelEvents(labelPayload, drawParams) {
  if (drawParams.isSelecting) {
    return {};
  }
  return {
    onLabelMouseEnter: (e) => drawParams.onLabelMouseEnter(e, labelPayload),
    onLabelMouseLeave: (e) => drawParams.onLabelMouseLeave(e, labelPayload),
    onLabelClick: (e) => drawParams.onLabelClick(e, labelPayload),
  };
}

function stackEvents(stackPayload, drawParams) {
  if (drawParams.isSelecting) {
    return {};
  }
  return {
    onMouseEnter: (e) => drawParams.stackMouseEnterEventListener(e, stackPayload),
    onMouseMove: (e) => drawParams.stackMouseMoveEventListener(e, stackPayload),
    onMouseLeave: (e) => drawParams.stackMouseLeaveEventListener(e, stackPayload),
  };
}

function drawBar(bar, drawParams) {
  const reactKonvaStacks = bar.stack.map(stack => drawStack(stack, stackEvents(stack.payload, drawParams)));
  const reactKonvaCommitHashLabel = drawLabel(bar.label, labelEvents(bar.label.payload, drawParams));

  return (
    <ReactKonva.Group>
      { reactKonvaStacks }
      { reactKonvaCommitHashLabel }
    </ReactKonva.Group>
  )
}

export function draw(visualData, params) {
  const chartLayerElements = visualData.bars.map(stackedBar => drawBar(stackedBar, params));
  return [
    <ReactKonva.Layer {...params.chartLayerProps}>
      { chartLayerElements }
    </ReactKonva.Layer>,
  ];
}
