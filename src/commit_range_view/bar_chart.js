const React = require('react');
const { convertToVisualData } = require('./data_converter');
const constants = require('./constants');
const ColorContext = require('../contexts/color_context');
const { useContext } = require('react');

const scrollContainerRef = React.createRef();
const largeContainerRef = React.createRef();

function BarChart(props) {
  const colorContext = useContext(ColorContext);
  const visualData = convertToVisualData(props.commits, {
    maxHeight: scrollContainerRef.current ? scrollContainerRef.current.clientHeight - constants.BAR_BOTTOM_MARGIN : 0,
    classToColorMapping: colorContext.classToColorMapping,
    isClassDisabled: props.isClassDisabled,
  });


  return(
    <GeneralDiagram {...this.state}
      rootStyle={{
        position: 'absolute',
        left: Y_AXIS_WIDTH + 'px',
        width: this.rootContainerRef.current ? this.rootContainerRef.current.clientWidth - Y_AXIS_WIDTH : undefined,
      }}
      scrollContainerRef={scrollContainerRef}
      largeContainerRef={largeContainerRef}
      onContainerScroll={props.onContainerScroll}
      onDraw={this.convertDataToPrimitiveShapes}>
    </GeneralDiagram>
  );
}

module.exports = React.memo(BarChart);