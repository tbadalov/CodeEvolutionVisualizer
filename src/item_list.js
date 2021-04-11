const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const { RadioGroup, RadioButton } = require('react-radio-buttons');
const itemListStyle = require('./css/item_list.css');
const Item = require('./item');

class ItemList extends React.Component {
  constructor(props) {
    super(props);
    this.mapRadioButtonValueToItemData = this.mapRadioButtonValueToItemData.bind(this);
    this.buildRadioButtons = this.buildRadioButtons.bind(this);
    this.buildCheckboxButtons = this.buildCheckboxButtons.bind(this);
  }

  buildRadioButtons(items) {
    return items.map((item, index) => {
      return (
        <RadioButton value={Number(index).toString()} rootColor={item.rootColor || 'black'} pointColor={item.color || "black"}>
          { item.label }
        </RadioButton>
      );
    });
  }

  buildCheckboxButtons(items) {
    return items.map((item, index) => <Item key={index} index={index} {...item} onItemChange={this.props.onItemChange} />);
  }

  mapRadioButtonValueToItemData(value) {
    /*const callbackData = {
      index: value,
      payload: this.props.items[value].payload,
    };*/
    this.props.onItemChange(value);
  }

  render() {
    const items = this.props.children || (this.props.isRadio
        ? this.buildRadioButtons(this.props.items || [])
        : this.buildCheckboxButtons(this.props.items || []));

    let response;
    if (this.props.isRadio) {
      response = (
        <RadioGroup onChange={this.mapRadioButtonValueToItemData} value="0">
          { items }
        </RadioGroup>
      );
    } else {
      response = (
        <ul className="real-list">
          { items }
        </ul>
      )
    }
    return(
      <div className="item-list menu-item">
        { this.props.title ? <p className='item-list-title'>{this.props.title}</p> : null }
        { response }
      </div>
    );
  }
}

module.exports = ItemList;
