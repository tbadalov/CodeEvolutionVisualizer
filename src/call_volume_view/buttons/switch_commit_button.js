const React = require('react');
const switchCommitButtonStyle = require('./css/switch_commit_button.less');

function onKeyboardArrowPress(event) {
  if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
    console.log(this.props.direction);
    this.props.onSwitchCommitButtonClick(this.props.direction);
  }
}

class SwitchCommitButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      onKeyboardArrowPressListener: onKeyboardArrowPress.bind(this),
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.state.onKeyboardArrowPressListener);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.state.onKeyboardArrowPressListener);
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
        onClick={ () => this.props.onSwitchCommitButtonClick(direction) } >
        { direction == 'prev' ? '<' : '>' }
      </a>
    );
  }
}

module.exports = SwitchCommitButton;
