const React = require('react');
const CommitRangeView = require('./commit_range_view');
const colorfulRadioButtonStyle = require('./css/colorful_radio_button.css');

function uuidv4() {
  // taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

class ColorfulRadioButton extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  render() {
    const randomUuid = uuidv4();
    return(
      <div className="colorful-checkbox">
        <input type="radio" id={randomUuid} name="radio-group" defaultChecked={this.props.checked || false} onChange={this.props.onChange} />
        <label htmlFor={randomUuid}>{this.props.label}</label>
      </div>
    );
  }
}

module.exports = ColorfulRadioButton;
