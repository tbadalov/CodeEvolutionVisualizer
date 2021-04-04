const { useState } = require('react');

export function usePrimitiveDiagramProps(defaultProps) {
  const [primitiveDiagramProps, setPrimitiveDiagramProps] = useState(defaultProps);
  const setStageHeight = (stageHeight) => setPrimitiveDiagramProps({
    ...primitiveDiagramProps,
    stageProps: {
      ...primitiveDiagramProps.stageProps,
      height: stageHeight,
    },
  });
  return [primitiveDiagramProps, setStageHeight, setPrimitiveDiagramProps];
}
