const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const { RadioGroup, RadioButton } = require('react-radio-buttons');
const itemListStyle = require('./css/item_list.css');

function buildRadioForm(items, onChange) {
  const radioButtons = items.map((item, index) => {
    return(
      <RadioButton value={Number(index).toString()} rootColor={'black'} pointColor="black">
        {item.label}
      </RadioButton>
    );
  });
  return(
    <RadioGroup onChange={onChange} value="0" vertical>
      {radioButtons}
    </RadioGroup>
  );
}

class ItemList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const items = this.props.isRadio ? buildRadioForm(this.props.items || [], this.props.onItemChange) : (this.props.items || []).map((item, index) => {
      return(
      <li key={index}>
        <ColorfulCheckbox {...item} onChange={() => this.props.onItemChange(index)}/>
      </li>);
    });

    const response = this.props.isRadio ? items : <ul className="real-list">
    { items }
  </ul>;
    return(
      <div className="item-list">
        {response}
      </div>
    );
  }
}

module.exports = ItemList;
