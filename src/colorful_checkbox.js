const React = require('react');
const { useState } = require('react');
const colorfulCheckboxStyle = require('./css/colorful_checkbox.css');

function propsToState(props) {
  if (props.checked) {
    return 'checked';
  }
  if (props.indeterminate) {
    return 'indeterminate';
  }
  return 'unchecked';
}

function nextState(currentState) {
  switch (currentState) {
    case 'unchecked':
      return 'checked';
    case 'checked':
      return 'unchecked';
    case 'indeterminate':
      return 'checked';
  }
}

function ColorfulCheckbox(props) {
  const [checkedState, setCheckedState] = useState(propsToState(props));
  const classNames = ['colorful-checkbox'];
  if (checkedState === 'checked') {
    classNames.push('colorful-checkbox-checked');
  } else if (checkedState === 'indeterminate') {
    classNames.push('colorful-checkbox-indeterminate');
  }
  return(
    <div className={classNames.join(' ')}
      style={{border: '5px solid ' + (props.color || '#000')}}
      onClick={() => setCheckedState(nextState(checkedState))} />
  );
}

module.exports = ColorfulCheckbox;
