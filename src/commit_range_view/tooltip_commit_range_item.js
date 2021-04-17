const React = require('react');
const tooltipCommitRangeItemStyle = require('./css/tooltip_commit_range_item.css');

class TooltipCommitRangeItem extends React.Component {
  render() {
    return(
      <div class="tooltip-item commit-range-tooltip-item">
        <span class="tooltip-marker" style={{ backgroundColor: this.props.markerColor }} ></span>
        <div class="tooltip-text">
          <div class="tooltip-y-group">
            <span class="tooltip-text-label">{ this.props.className + ": " }</span>
            <span class="tooltip-text-value">{ this.props.amount } </span>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = TooltipCommitRangeItem;
