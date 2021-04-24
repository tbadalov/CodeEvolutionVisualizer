const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const checkboxItemStyle = require('./css/checkbox_item.css');

function CheckboxItem(props) {
  return (
    <li className='checkbox-item'>
      <ColorfulCheckbox {...props} onChange={() => props.onItemChange({ index: props.index, payload: props.payload})} />
      <p>{props.label}</p>
    </li>
  );
}

module.exports = CheckboxItem;
