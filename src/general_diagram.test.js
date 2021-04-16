const React = require('react');
const GeneralDiagram = require('./general_diagram');
const ShallowRenderer = require('react-test-renderer/shallow');
const ReactKonva = require('react-konva');

test('it renders correctly', () => {
  //given
  const renderer = new ShallowRenderer();
  //when
  renderer.render(<GeneralDiagram />);
  //then
  const result = renderer.getRenderOutput();
  expect(result.type).toBe('div');
});
