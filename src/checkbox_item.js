const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const checkboxItemStyle = require('./css/checkbox_item.css');

function CheckboxItem(props) {
  const classNames = [
    'checkbox-item',
  ];
  if (props.noCheckbox) {
    classNames.push('no-checkbox');
  }
  return (
    <div className={classNames.join(' ')}>
      {
        props.noCheckbox
          ? null
          : <ColorfulCheckbox {...props}
              onChange={
                (checkboxState) => props.onItemChange({
                  checkboxState,
                  index: props.index,
                  payload: props.payload,
                })
              }
            />
      }
      <p>{props.label}</p>
    </div>
  );
}

module.exports = CheckboxItem;
