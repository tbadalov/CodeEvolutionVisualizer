const React = require('react');
const PrimitiveDiagram = require('./primitive_diagram');

class GeneralDiagram extends React.Component {

  render() {
    return(
      <div
        className={"scroll-container" + (this.props.hideScrollbar ? ' hide-scrollbar' : '')}
        onScroll={this.props.onContainerScroll}
        onMouseMove={this.props.onContainerMouseMove}
        onMouseDown={this.props.onContainerMouseDown}
        style={this.props.rootStyle}
        ref={this.props.scrollContainerRef}
      >
        <div
          className="large-container"
          ref={this.props.largeContainerRef}
        >
          <div
            className="container"
            style={{transform: `translate(${this.props.scrollLeft}px, 0px)`, cursor: this.props.cursorStyle}}
          >
            <PrimitiveDiagram
              {...this.props.primitiveDiagramProps}
              onDraw={this.props.onDraw} />
          </div>
        </div>
        { this.props.children }
      </div>
    );
  }
}

module.exports = GeneralDiagram;
