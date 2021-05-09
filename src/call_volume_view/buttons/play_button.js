const React = require('react');
const switchCommitButtonStyle = require('./css/play_button.scss');

class PlayButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.buttonStateContainerRef = React.createRef();
    this.onPlayButtonClicked = this.onPlayButtonClicked.bind(this),
    this.animationTimeout = null;
    this.state = {
      isPaused: (this.props.isPaused === undefined ? true : this.props.isPaused),
    };
  }

  onPlayButtonClicked() {
    this.setState({
      isPaused: !this.state.isPaused,
    });
  }

  componentDidUpdate() {
    if (this.state.isPaused || this.props.isPaused) {
      if (this.props.onPause) {
        this.props.onPause();
      }
      if (!this.state.isPaused) {
        this.setState({
          isPaused: true,
        });
      }
    } else {
      if (this.props.onPlay) {
        this.props.onPlay();
      }
    }
  }

  render() {
    const isPaused = this.state.isPaused;
    const pauseClassName = "pause" + (!isPaused ? " active" : "");
    const playClassName = "play" + (isPaused ? " active" : "");
    return(
      <div className="play-button">
        <div
          ref={this.buttonStateContainerRef}
          className="play-button-state-container"
          onClick={this.onPlayButtonClicked} >
          <div className={pauseClassName} >
            <div className="line line_1"></div>
            <div className="line line_2"></div>
          </div>
          <div className={playClassName} >
            <div className="line line_1"></div>
            <div className="line line_2"></div>
            <div className="line line_3"></div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = PlayButton;
