const React = require('react');
const tooltipCommitRangeItemStyle = require('./css/tooltip_commit_range_item.css');

class CommitDetailTooltipItem extends React.Component {
  render() {
    return(
      <div class="tooltip-item commit-range-tooltip-item">
        <div class="tooltip-text">
          <div class="tooltip-y-group">
            <span class="tooltip-text-label">{ this.props.detailName + ": " }</span>
            <span class="tooltip-text-value">{ this.props.detailValue } </span>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = CommitDetailTooltipItem;
