const React = require('react');
const GeneralDiagram = require('../general_diagram');
const { convertToVisualData } = require('./data_converter');
const constants = require('./constants');
const ColorContext = require('../contexts/color_context');
const { useContext, useEffect } = require('react');
const { draw } = require('./diagram_sketcher');
const { usePrimitiveDiagramProps } = require('../common');

/*const scrollContainerRef = React.createRef();
const largeContainerRef = React.createRef();*/

const defaultStageProps = {
  stageProps: {
    width: 0,
    height: 0,
    x: -constants.PADDING,
  },
};

function BarChart(props) {
  const colorContext = useContext(ColorContext);
  const  [primitiveDiagramProps, setStageHeight, setStageWidth, setPrimitiveDiagramProps] = usePrimitiveDiagramProps(defaultStageProps);
  useEffect(() => {
    if (props.width) {
      setStageWidth(props.width - constants.Y_AXIS_WIDTH);
    }
    if (props.height) {
      setStageHeight(props.height);
    }
  }, [props.width, props.height]);
  const visualData = convertToVisualData(props.commits, {
    maxHeight: primitiveDiagramProps.stageProps.height - constants.BAR_BOTTOM_MARGIN,
    classToColorMapping: colorContext.classToColorMapping,
    isClassDisabled: props.isClassDisabled,
  });
  const onDraw = () => draw(visualData, {
    ...props,
  });

  return(
    <GeneralDiagram {...props}
      rootStyle={{
        position: 'absolute',
        left: constants.Y_AXIS_WIDTH + 'px',
        width: props.width,
      }}
      primitiveDiagramProps={primitiveDiagramProps}
      scrollContainerRef={props.scrollContainerRef}
      largeContainerRef={props.largeContainerRef}
      onContainerScroll={props.onContainerScroll}
      onDraw={onDraw}>
    </GeneralDiagram>
  );
}

module.exports = React.memo(BarChart);