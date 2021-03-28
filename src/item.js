const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const { RadioButton } = require('react-radio-buttons');

function Item(props) {
  let item;
  if (props.isRadio) {
    item = (
      <RadioButton value={Number(props.index).toString()} rootColor={props.rootColor || 'black'} pointColor={props.color || "black"}>
        { props.label }
      </RadioButton>
    );
  } else {
    item = <ColorfulCheckbox {...props} onChange={() => props.onItemChange({ index: props.index, payload: props.payload})} />;
  }
  return (
    <li>
      { item }
    </li>
  );
}

module.exports = Item;
