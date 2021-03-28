const React = require('react');
const menuStyle = require('./css/menu.css');

const Menu = (props) => {
  return(
    <div className="minu-menu">
      { (props.children || []).concat(props.items || []) }
    </div>
  );
};

module.exports = Menu;
