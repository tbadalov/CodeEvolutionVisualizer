const { useState, useRef } = require('react');
const React = require('react');
const AnimateHeight = require('react-animate-height').default;
const CheckboxItem = require('../checkbox_item');
const accordionStyle = require('./css/accordion.css');

function preventTextSelectionOnDoubleClick(mouseEvent) {
  if (mouseEvent.detail > 1) {
    mouseEvent.preventDefault();
  }
}

function didEventStartFromCheckbox(mouseEvent) {
  return mouseEvent.target.classList.contains('colorful-checkbox')
}

function AccordionItem(props) {
  const [collapsed, setCollapsed] = useState(props.collapsed || false);
  const classNames = [
    'accordion',
  ];
  if (collapsed) {
    classNames.push('accordion-collapsed');
  }

  function toggleCollapse() {
    setCollapsed(!collapsed);
  }

  function onClick(clickEvent) {
    if (!didEventStartFromCheckbox(clickEvent)) {
      toggleCollapse();
    }
  }

  return(
    <div className={classNames.join(' ')}>
      <div className='accordion-header'
        onClick={onClick}
        onMouseDown={preventTextSelectionOnDoubleClick}>
        <CheckboxItem label={props.title}
          noCheckbox={!props.withCheckbox}
          checked={props.checked}
          onItemChange={props.onBulkChange}
          indeterminate={props.indeterminate} />
      </div>
      <AnimateHeight
        duration={400}
        height={collapsed ? 0 : 'auto'}
      >
        { props.children }
      </AnimateHeight>
    </div>
  );
}

module.exports = AccordionItem;
