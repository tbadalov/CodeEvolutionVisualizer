const { useState } = require('react');

export function usePrimitiveDiagramProps(defaultProps) {
  var [primitiveDiagramProps, setPrimitiveDiagramProps] = useState(defaultProps);
  const setStageHeight = (stageHeight) => setPrimitiveDiagramProps({
    ...primitiveDiagramProps,
    stageProps: {
      ...primitiveDiagramProps.stageProps,
      height: stageHeight,
    },
  });
  const setStageWidth = (stageWidth) => setPrimitiveDiagramProps({
    ...primitiveDiagramProps,
    stageProps: {
      ...primitiveDiagramProps.stageProps,
      width: stageWidth,
    },
  });
  return [primitiveDiagramProps, setStageHeight, setStageWidth, setPrimitiveDiagramProps];
}
