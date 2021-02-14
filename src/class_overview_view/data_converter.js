const { groupBy } = require('../utils');

//function buildMethodRecord()

function buildColumn(convertationState, commit, commitData) {
  const { methodNameToRowMapping } = convertationState;
  const columnData = {
    commit: commit,
    rows: {},
  };
  const rows = commitData.reduce(
    (rows, record) => {
      const methodName = record.method;
      const methodRow = methodNameToRowMapping[methodName];
      const status = record.status;
      const calls = record.called_methods.map(called_method_name => methodNameToRowMapping[called_method_name]);
      rows[methodRow] = {
        methodName,
        status,
        calls,
      };
      return rows;
    },
    {},
  );
  columnData.rows = rows;
  return columnData;
}

function getAllMethodNames(rawRecords) {
  const foundMethods = {};
  for (let i = 0; i < rawRecords.length; i++) {
    const methodName = rawRecords[i].method;
    if (!foundMethods[methodName]) {
      foundMethods[methodName] = true;
    }
  }
  return Object.keys(foundMethods).sort();
}

function mapMethodNamesToRows(methodNames) {
  const methodNameToRowMapping = {};
  methodNames.sort().forEach((methodName, index) => methodNameToRowMapping[methodName] = index);
  return methodNameToRowMapping;
}


class DataConverter {
  groupDataIntoCommitColumnsAndMethodRows(rawData) {
    const methodNameToRowMapping = mapMethodNamesToRows(getAllMethodNames(rawData));
    const data = {columns: []};
    let recordsGroupedByCommitHash = groupBy(records, 'commit');
    for (let commit in recordsGroupedByCommitHash) {
      const columnData = buildColumn(
        {
          methodNameToRowMapping,
        },
        commit,
        recordsGroupedByCommitHash[commit]
      );
      data.columns.push(columnData);
    }
    return data;
  }
}

/*
{
  columns: [
    {
      commit: 'hhhhdddsdfsdfjsldkfjas',
      rows: {
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