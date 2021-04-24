const React = require('react');
const { useState, useEffect } = require('react');
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
  useEffect(() => {
    setCheckedState(propsToState(props));
  }, [props.checked, props.indeterminate]);
  const classNames = ['colorful-checkbox'];
  if (checkedState === 'checked') {
    classNames.push('colorful-checkbox-checked');
  } else if (checkedState === 'indeterminate') {
    classNames.push('colorful-checkbox-indeterminate');
  }

  function onClick() {
    const newState = nextState(checkedState);
    setCheckedState(newState);
    if (props.onChange) {
      props.onChange(newState);
    }
  }

  return(
    <div className={classNames.join(' ')}
      style={{border: '5px solid ' + (props.color || '#000')}}
      onClick={onClick} />
  );
}

module.exports = ColorfulCheckbox;
