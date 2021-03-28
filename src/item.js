const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const { RadioButton } = require('react-radio-buttons');

function Item(props) {
  return (
    <li>
      <ColorfulCheckbox {...props} onChange={() => props.onItemChange({ index: props.index, payload: props.payload})} />
    </li>
  );
}

module.exports = Item;
