const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const { RadioGroup, RadioButton } = require('react-radio-buttons');
const itemListStyle = require('./css/item_list.css');
const CheckboxItem = require('./checkbox_item');
const AccordionItem = require('./control_elements/accordion_item');

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
    return items.map((item, index) => (
      <li>
        <CheckboxItem key={index} index={index} {...item} onItemChange={this.props.onItemChange} />
      </li>
    ));
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
    const rawItems = this.props.items || [];
    return(
      <div className="item-list menu-item">
        <AccordionItem title={this.props.title}
          withCheckbox={!this.props.isRadio && this.props.withCheckbox}
          checked={rawItems.every(item => item.checked)}
          indeterminate={rawItems.some(item => item.checked) && rawItems.some(item => !item.checked)}
          collapsed={this.props.collapsed}>
          { response }
        </AccordionItem>
      </div>
    );
  }
}

module.exports = ItemList;
