function buildColumn(commitData, props) {
  const { methodNameToRowNumberMapping, didMethodChangeInBranchBeforeCommit } = props;
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
      const wasMethodChangedInMergedBranch = commitData.mergedBranchNames.find(mergedBranchName => didMethodChangeInBranchBeforeCommit[mergedBranchName][methodName] && didMethodChangeInBranchBeforeCommit[mergedBranchName][methodName][commitHash]);
      const status = record.status === 'same' && wasMethodChangedInMergedBranch ? 'semi-changed' : record.status;
      const calls = record.calls.map(called_method_name => methodNameToRowNumberMapping[called_method_name]);
      rows[methodRow] = {
        methodName,
        status,
        calls,
      };
      if (status === 'semi-changed') {
        rows[methodRow].changingBranch = wasMethodChangedInMergedBranch;
      }
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

function findMergeCommitsAfterMethodChangingBranches(rawData) {
  const result = {};
  const tempData = {};

  for (let i = 0; i < rawData.length; i++) {
    const commitRecord = rawData[i];
    if (commitRecord.mergedBranchNames.length == 0) {
      if (!tempData[commitRecord.branchName]) {
        tempData[commitRecord.branchName] = {};
      }
      commitRecord.methods.forEach(method => {
        tempData[commitRecord.branchName][method.name] = tempData[commitRecord.branchName][method.name] || method.status !== 'same';
      });
    } else {
      commitRecord.mergedBranchNames.forEach(mergedBranchName => {
        if (tempData[mergedBranchName]) {
          Object.keys(tempData[mergedBranchName]).forEach(changedMethodName => {
            if (!result[mergedBranchName]) {
              result[mergedBranchName] = {};
            }
            if (!result[mergedBranchName][changedMethodName]) {
              result[mergedBranchName][changedMethodName] = {};
            }
            if (tempData[mergedBranchName][changedMethodName]) {
              result[mergedBranchName][changedMethodName][commitRecord.commitHash] = true;
            }
          });
        }
        delete tempData[mergedBranchName];
      });
    }
  }

  return result;
}

class ClassOverviewDataConverter {
  groupDataIntoCommitColumnsAndMethodRows(rawData) {
    const methodNameToRowNumberMapping = mapMethodNamesToRowNumber(getAllMethodNames(rawData));
    const didMethodChangeInBranchBeforeCommit = findMergeCommitsAfterMethodChangingBranches(rawData);
    const data = {
      columns: [],
      methodNameToRowNumberMapping,
    };
    for (let commitRecord of rawData) {
      const columnData = buildColumn(
        commitRecord,
        {
          methodNameToRowNumberMapping,
          didMethodChangeInBranchBeforeCommit
        },
      );
      data.columns.push(columnData);
    }
    return data;
  }

  combineColumnsWithTheSameState(groupedData) {
    const resultingColumns = [];
    if (groupedData.columns.length > 0) {
      resultingColumns.push({
        ...groupedData.columns[0],
        isAggregation: false,
        aggregatedColumns: [],
      });
    }
    for (let i = 1; i < groupedData.columns.length; i++) {
      const [prevColumn, currentColumn] = [groupedData.columns[i-1], groupedData.columns[i]];
      const mergedRowsData = {
        ...prevColumn.row,
        ...currentColumn.row,
      };
      const mergedRowNumbers = Object.keys(mergedRowsData);
      if (mergedRowNumbers.length > Object.keys(prevColumn.row).length || mergedRowNumbers.length > Object.keys(currentColumn.row).length) {
        resultingColumns.push({
          ...currentColumn,
          isAggregation: false,
          aggregatedColumns: [],
        });
      } else if (Object.entries(mergedRowsData).some(([rowNumber,]) => prevColumn.row[rowNumber].status !== currentColumn.row[rowNumber].status)) {
        resultingColumns.push({
          ...currentColumn,
          isAggregation: false,
          aggregatedColumns: [],
        })
      } else if (resultingColumns[resultingColumns.length-1].isAggregation) {
        resultingColumns[resultingColumns.length-1].aggregatedColumns.push({
          ...currentColumn,
        });
      } else {
        resultingColumns[resultingColumns.length-1].isAggregation = true;
        resultingColumns[resultingColumns.length-1].aggregatedColumns.push({
            ...prevColumn,
        });
      }
    }
    return {
      ...groupedData,
      columns: resultingColumns,
    };
  }
}

module.exports = ClassOverviewDataConverter;
