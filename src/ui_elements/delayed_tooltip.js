const React = require('react');
const TooltipWithGithubButton = require('./tooltip_with_github_button');
const DelayedRender = require("./delayed_render");

function DelayedTooltip(props) {
  return (
    <DelayedRender timeout={props.delay}
      shouldDelay={() => props.visible}
      render={() => {
        return (
          <props.tooltipClass {...props} />
        );
      }} />
  )
}

module.exports = DelayedTooltip;
