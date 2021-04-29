const { useState, useEffect } = require('react');
const React = require('react');

function shouldDelay(props) {
  if (props.shouldDelay) {
    return props.shouldDelay();
  }
  return true;
}

function DelayedRender(props) {
  const [renderTimeout, setRenderTimeout] = useState(0);
  const [children, setChildren] = useState(null);

  function updateChildren() {
    setChildren(props.render ? props.render() : null);
  }

  useEffect(() => {
    if (renderTimeout) {
      clearTimeout(renderTimeout);
    }

    const timeout = setTimeout(updateChildren, props.timeout);
    setRenderTimeout(timeout);

    return function cleanup() {
      clearTimeout(renderTimeout);
    }
  }, [props])

  return children;
}

module.exports = DelayedRender;
