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

function drawBar(bar, params) {
  const reactKonvaStacks = bar.stack.map(stack => {
    if (stack.payload.commitHash === params.strokedStackCommitHash && stack.payload.changedClassName === params.strokedStackClassName) {
      stack.stroke = params.strokedStackBorderColor;
    }
    return drawStack(stack, {
      onMouseEnter: (e) => params.stackMouseEnterEventListener(e, stack.payload),
      onMouseMove: (e) => params.stackMouseMoveEventListener(e, stack.payload),
      onMouseLeave: (e) => params.stackMouseLeaveEventListener(e, stack.payload),
    });
  });
  const reactKonvaText = drawLabel(bar.label, {
    onLabelMouseEnter: (e) => params.onLabelMouseEnter(e, bar.label.payload),
    onLabelMouseLeave: (e) => params.onLabelMouseLeave(e, bar.label.payload),
    onLabelClick: (e) => params.onLabelClick(e, bar.label.payload),
  });

  return (
    <ReactKonva.Group>
      { reactKonvaStacks }
      { reactKonvaText }
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
