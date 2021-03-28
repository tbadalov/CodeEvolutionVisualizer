const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const { RadioGroup, RadioButton } = require('react-radio-buttons');
const itemListStyle = require('./css/item_list.css');
const Item = require('./item');

function buildRadioButtons(items) {
  return items.map((item, index) => <Item {...item} index={index} isRadio />);
}

function buildCheckboxButtons(items) {
  return items.map((item, index) => <Item key={index} index={index} {...item} />);
}



class ItemList extends React.Component {
  constructor(props) {
    super(props);
    this.mapRadioButtonValueToItemData = this.mapRadioButtonValueToItemData.bind(this);
  }

  mapRadioButtonValueToItemData(value) {
    return {
      index: value,
      payload: this.props.items[value].payload,
    };
  }

  render() {
    const items = this.props.children || (this.props.isRadio
        ? buildRadioForm(this.props.items || [])
        : buildCheckboxButtons(this.props.items || []));

    let response;
    if (this.props.isRadio) {
      response = (
        <RadioGroup onChange={this.mapRadioButtonValueToItemData} value="0" vertical>
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
      <div className="item-list">
        { this.props.title ? <p className='item-list-title'>{this.props.title}</p> : null }
        { response }
      </div>
    );
  }
}

module.exports = ItemList;
