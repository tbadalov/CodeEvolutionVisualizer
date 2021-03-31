const React = require('react');
const PrimitiveDiagram = require('./primitive_diagram');

class GeneralDiagram extends React.Component {

  render() {
    return(
      <div>
        <div
          className="scroll-container"
          onScroll={this.props.onContainerScroll}
          onMouseMove={this.props.onContainerMouseMove}
          onMouseDown={this.props.onContainerMouseDown}
          ref={this.props.scrollContainerRef}
        >
          <div
            className="large-container"
            style={{
              width: this.props.primitiveDiagramProps.stageProps.width + 'px',
              height: this.props.largeContainerHeight + 'px',
            }}
            ref={this.props.largeContainerRef}
          >
            <div
              className="container"
              style={{transform: `translate(${this.props.scrollLeft}px, 0px)`, cursor: this.props.cursorStyle}}
            >
              <PrimitiveDiagram {...this.props.primitiveDiagramProps}/>
            </div>
          </div>
        </div>
        { this.props.children }
      </div>
    );
  }
}

module.exports = GeneralDiagram;
