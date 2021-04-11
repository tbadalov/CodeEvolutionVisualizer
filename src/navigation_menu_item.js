const React = require('react');
const navigationMenuItemStyle = require('./css/navigation_menu_item.scss');

function NavigationMenuItem() {
  return (
    <div className='navigation-menu-item menu-item'>
      <div className='navigation-menu-item-button'>
        <a className='label'>Back</a>
      </div>
      <div className='navigation-menu-item-button' style={{marginLeft: '10px'}}>
        <a className='label'>Next</a>
      </div>
    </div>
  )
}

module.exports = NavigationMenuItem;
