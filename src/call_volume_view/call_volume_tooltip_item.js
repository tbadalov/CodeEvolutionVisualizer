const React = require('react');
const TooltipCommitRangeItem = require('../commit_range_view/tooltip_commit_range_item');
const callVolumeTooltipItemStyle = require('./css/call_volume_tooltip_item.css');
const { useContext } = require('react');

function CallVolumeTooltipItem(props) {
  return(
    <div class="tooltip-item call-volume-tooltip-item">
      <div class="tooltip-text">
        <div class="tooltip-y-group">
          <span class="tooltip-text-label">{ props.methodName + ": " }</span>
          <span class="tooltip-text-value">Called { props.totalCalls } time{props.totalCalls === 1 ? '' : 's'}</span>
        </div>
      </div>
      {
        props.calledBy.map(caller => (
          <TooltipCommitRangeItem markerColor={caller.color}
            className={caller.className}
            amount={caller.callAmount}
          />
        ))
      }
    </div>
  );
}

module.exports = CallVolumeTooltipItem;
