const { useState, useEffect } = require('react');
const React = require('react');
const ReactDOM = require('react-dom');
const tooltipStyle = require('./css/tooltip.css');

function tooltipElement(props) {
  return (
    <div className={"tooltip" + (props.visible ? " tooltip-active" : "")} style={{left: props.left + 'px', top: props.top + 'px'}}>
      <div className="tooltip-title">
        { props.title }
      </div>
      <div className="tooltip-body">
        { props.children || props.items }
      </div>
    </div>
  );
}

function measureSize(props, callback) {
  const dummyContainer = document.createElement('div');
  document.body.appendChild(dummyContainer);
  ReactDOM.render(
    tooltipElement({
      ...props,
      left: -9999,
      top: -9999,
    }),
    dummyContainer,
    () => {
      const tooltipWidth = dummyContainer.firstChild.offsetWidth;
      const tooltipHeight = dummyContainer.firstChild.offsetHeight;
      dummyContainer.remove();
      callback(tooltipWidth, tooltipHeight);
    }
  );
}

function Tooltip(props) {
    const {
      top,
      left,
    } = props;

    const [tooltipWidth, setTooltipWidth] = useState(0);
    const [tooltipHeight, setTooltipHeight] = useState(0);
    const [canDisplay, setCanDisplay] = useState(false);
    useEffect(() => {
      if (!props.visible) {
        setCanDisplay(false);
      }
    }, [props.visible]);

    let tooltipLeft = left;
    let tooltipTop = top;
    if (props.visible) {
      measureSize(
        props,
        (width, height) => {
          setTooltipWidth(width);
          setTooltipHeight(height);
          setCanDisplay(true);
        }
      );
    }

    tooltipLeft = tooltipLeft + tooltipWidth <= window.innerWidth ? tooltipLeft : tooltipLeft - tooltipWidth;
    tooltipTop = tooltipTop + tooltipHeight <= window.innerHeight ? tooltipTop : window.innerHeight - tooltipHeight;

    return tooltipElement({
      ...props,
      left: tooltipLeft,
      top: tooltipTop,
      visible: canDisplay,
    });
}

module.exports = Tooltip;
