const React = require('react');
const navigationMenuItemStyle = require('./css/navigation_menu_item.scss');

function NavigationMenuItem(props) {

  return (
    <div className={'navigation-menu-item menu-item' + (props.canGoBack ? '' : ' disabled')}>
      <div className='navigation-menu-item-button'>
        <a className='label' onClick={props.onBackClick}>Back</a>
      </div>
      <div className={'navigation-menu-item-button' + (props.canGoForward ? '' : ' disabled')} style={{marginLeft: '10px'}}>
        <a className='label' onClick={props.onForwardClick}>Forward</a>
      </div>
    </div>
  );
}

module.exports = NavigationMenuItem;
