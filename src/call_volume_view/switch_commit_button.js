const React = require('react');
const switchCommitButtonStyle = require('./css/switch_commit_button.less');

class SwitchCommitButton extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const direction = this.props.direction;
    const classNames = [ "switch-commit-button", "switch-commit-button-circle" ];
    if (direction == 'prev') {
      classNames.push("prev-commit-button");
    } else if (direction == 'next' ) {
      classNames.push("next-commit-button");
    };

    return(
      <a
        className={ classNames.join(' ') }
        href="#"
        onClick={ () => this.props.onSwitchCommitButtonClick(direction) } >
        { direction == 'prev' ? '<' : '>' }
      </a>
    );
  }
}

module.exports = SwitchCommitButton;
