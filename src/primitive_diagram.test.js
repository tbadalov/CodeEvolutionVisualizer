const React = require('react');
const PrimitiveDiagram = require('./primitive_diagram');
const ShallowRenderer = require('react-test-renderer/shallow');
const ReactKonva = require('react-konva');

test('renders correctly', () => {
  //given
  const renderer = new ShallowRenderer();
  //when
  renderer.render(<PrimitiveDiagram stageProps={{testProp: 'test'}} onDraw={() => [<ReactKonva.Layer key='test-key'><ReactKonva.Rect/></ReactKonva.Layer>]}/>);
  //then
  const result = renderer.getRenderOutput();
  expect(result.props).toHaveProperty('testProp', 'test');
  expect(result.props.children).toEqual([
    <ReactKonva.Layer key='test-key'>
      <ReactKonva.Rect />
    </ReactKonva.Layer>
  ]);
});

test('renders without onDraw method', () => {
  //given
  const renderer = new ShallowRenderer();
  //when
  renderer.render(<PrimitiveDiagram />);
  //then
  const result = renderer.getRenderOutput();
  expect(result.props.children).toEqual(null);
});
