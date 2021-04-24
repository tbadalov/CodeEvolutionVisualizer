const { useState, useRef } = require('react');
const React = require('react');
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
  const [accordionBodyHeight, setAccordionBodyHeight] = useState(0);
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

  function setAccordionBodyHeightForAnimation(accordionBody) {
    if (!collapsed) {
      const newHeight = accordionBody ? accordionBody.firstChild.clientHeight : 0;
      setAccordionBodyHeight(newHeight);
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
      <div className='accordion-body'
        style={{height: accordionBodyHeight + 'px'}}
        ref={setAccordionBodyHeightForAnimation}>
        { props.children }
      </div>
    </div>
  );
}

module.exports = AccordionItem;
