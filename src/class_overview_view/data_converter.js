const { groupBy } = require('../utils');

function buildColumn(commitData, props) {
  const { methodNameToRowNumberMapping } = props;
  const commitHash = commitData.commitHash;
  const columnData = {
    commitHash: commitHash,
    branchName: commitData.branchName,
    row: {},
  };
  const rows = commitData.methods.reduce(
    (rows, record) => {
      const methodName = record.name;
      const methodRow = methodNameToRowNumberMapping[methodName];
      const status = record.status;
      const calls = record.calls.map(called_method_name => methodNameToRowNumberMapping[called_method_name]);
      rows[methodRow] = {
        methodName,
        status,
        calls,
      };
      return rows;
    },
    {},
  );
  columnData.row = rows;
  return columnData;
}

function getAllMethodNames(rawRecords) {
  const foundMethods = {};
  rawRecords
    .flatMap(commit => commit.methods)
    .forEach(method => foundMethods[method.name] = true);

  return Object.keys(foundMethods).sort();
}

function mapMethodNamesToRowNumber(methodNames) {
  const methodNameToRowMapping = {};
  methodNames.forEach((methodName, index) => methodNameToRowMapping[methodName] = index);
  return methodNameToRowMapping;
}


class ClassOverviewDataConverter {
  groupDataIntoCommitColumnsAndMethodRows(rawData) {
    const methodNameToRowNumberMapping = mapMethodNamesToRowNumber(getAllMethodNames(rawData));
    const data = {
      columns: [],
      methodNameToRowNumberMapping,
    };
    for (let commitRecord of rawData) {
      const columnData = buildColumn(
        commitRecord,
        {
          methodNameToRowNumberMapping,
        },
      );
      data.columns.push(columnData);
    }
    return data;
  }
}

module.exports = ClassOverviewDataConverter;

/*
{
  columns: [
    {
      commit: 'hhhhdddsdfsdfjsldkfjas',
      row: {
        3: {
          methodName: 'hello()',
          status: 'new' | 'changed' | 'same',
          calls: [4, 5]
        }
      }
    },
    {

    }
  ]
}
*/