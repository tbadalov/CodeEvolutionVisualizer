const testData = require('./call_volume_test_raw_data');
const colors = require('./class_colors');
const { convertToVisualizationData, draw } = require('../call_volume_diagram_sketcher');
const expected_visualization_data = require('./expected_visualization_data');
const React = require('react');

test('test converts to visualization data correctly', () => {
  //given
  //when
  const visualizationData = convertToVisualizationData(testData.classes, { classToColorMapping: colors });
  //then
  expect(visualizationData).toEqual(expected_visualization_data);
});

test('test renders correctly', () => {
  //given
  const drawParams = { key: 'minu-layer', opacity: 0.5, layerRef: React.createRef() };
  //when
  const layers = draw(expected_visualization_data, drawParams);
  //then
  expect(layers).toHaveLength(1);
  expect(layers[0].key.includes("minu-layer")).toBe(true);
  expect(layers[0].props).toHaveProperty('opacity', 0.5);
  expect(layers[0].props.children).toHaveLength(testData.classes.length);
})
