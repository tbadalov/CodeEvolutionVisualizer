const CallVolumeDiagramPositioner = require('../call_volume_diagram_positioner');
const testData = require('./call_volume_test_raw_data');

test('assigns correct node radiuses', () => {
  //given
  const callVolumeDiagramPositioner = new CallVolumeDiagramPositioner(testData.classes);
  const expectedValues = [1, 1, 1, 1, 2, 4];
  expectedValues.forEach((expectedNodeRadius, methodIndex) => {
    //when
    const nodeRadius = callVolumeDiagramPositioner.nodeRadius(6, methodIndex);
    //then
    expect(nodeRadius).toBe(expectedNodeRadius);
  });
});

test('assigns correct pipe widths', () => {
  //given
  const callVolumeDiagramPositioner = new CallVolumeDiagramPositioner(testData.classes);
  const expectedValues = [2, 1, 1, 1, 1, 1, 2, 0];
  expectedValues.forEach((expectedPipeWidth, classIndex) => {
    //when
    const pipeWidth = callVolumeDiagramPositioner.pipeWidth(classIndex);
    //then
    expect(pipeWidth).toBe(expectedPipeWidth);
  });
});

test('assigns correct vertical direction for pipes of odd amount', () => {
  //given
  const expectedValues = [-1, 1, -1, 1, 0, 1, -1, 1, -1];
  const callVolumeDiagramPositioner = new CallVolumeDiagramPositioner(expectedValues);
  expectedValues.forEach((expectedVerticalDirection, classIndex) => {
    //when
    const verticalDirection = callVolumeDiagramPositioner.directionY(classIndex);
    //then
    expect(verticalDirection).toBe(expectedVerticalDirection);
  });
});

test('assigns correct vertical direction for pipes of even amount', () => {
  //given
  const expectedValues = [-1, 1, -1, -1, 1, -1];
  const callVolumeDiagramPositioner = new CallVolumeDiagramPositioner(expectedValues);
  expectedValues.forEach((expectedVerticalDirection, classIndex) => {
    //when
    const verticalDirection = callVolumeDiagramPositioner.directionY(classIndex);
    //then
    expect(verticalDirection).toBe(expectedVerticalDirection);
  });
});

test('assigns correct horizontal direction for pipes of odd amount', () => {
  //given
  const expectedValues = [-1, -1, -1, -1, 0, 1, 1, 1, 1];
  const callVolumeDiagramPositioner = new CallVolumeDiagramPositioner(expectedValues);
  expectedValues.forEach((expectedHorizontalDirection, classIndex) => {
    //when
    const horizontalDirection = callVolumeDiagramPositioner.directionX(classIndex);
    //then
    expect(horizontalDirection).toBe(expectedHorizontalDirection);
  });
});

test('assigns correct horizontal direction for pipes of even amount', () => {
  //given
  const expectedValues = [-1, -1, -1, 1, 1, 1];
  const callVolumeDiagramPositioner = new CallVolumeDiagramPositioner(expectedValues);
  expectedValues.forEach((expectedHorizontalDirection, classIndex) => {
    //when
    const horizontalDirection = callVolumeDiagramPositioner.directionX(classIndex);
    //then
    expect(horizontalDirection).toBe(expectedHorizontalDirection);
  });
});
