const React = require('react');
const ColorfulCheckbox = require('./colorful_checkbox');
const itemListStyle = require('./css/item_list.css');

class ItemList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const items = (this.props.items || []).map((item, index) => {
      return(
      <li key={index}>
        <ColorfulCheckbox {...item} onChange={() => this.props.onItemChange(index)}/>
      </li>);
    });

    return(
      <div className="minu-menu">
        <div className="item-list">
          <ul className="real-list">
            { items }
          </ul>
        </div>
      </div>
    );
  }
}

module.exports = ItemList;
