const React = require('react');

const Menu = (props) => {
  return(
    <div className="minu-menu">
      { (props.children || []).concat(props.items || []) }
    </div>
  );
};

module.exports = Menu;
