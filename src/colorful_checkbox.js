const React = require('react');
const CommitRangeView = require('./commit_range_view');
const colorfulCheckboxStyle = require('./css/colorful_checkbox.css');

function uuidv4() {
  // taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

class ColorfulCheckbox extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const randomUuid = uuidv4();
    const classNames = ['colorful-checkbox'];
    if (this.props.checked) {
      classNames.push('colorful-checkbox-checked');
    } else if (this.props.indeterminate) {
      classNames.push('colorful-checkbox-indeterminate');
    }
    return(
      <div className={classNames.join(' ')}>
        <input type="checkbox" id={randomUuid} defaultChecked={this.props.checked || this.props.indeterminate || false} onChange={this.props.onChange} />
        <label htmlFor={randomUuid} style={{border: '5px solid ' + (this.props.color || '#000')}}></label>
        <p>{this.props.label}</p>
      </div>
    );
  }
}

module.exports = ColorfulCheckbox;
