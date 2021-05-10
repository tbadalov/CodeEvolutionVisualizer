import React from 'react';
import CallVolumeTooltipItem from './call_volume_view/call_volume_tooltip_item';
import CommitDetailTooltipItem from "./commit_range_view/commit_detail_tooltip_item";
import TooltipCommitRangeItem from './commit_range_view/tooltip_commit_range_item';

export function loadData(url) {
  return fetch(url)
          .then((result) => result.json());
}

export function buildGetHttpRequestUrl(url, params = {}) {
  const keyValues = [];
  for (let paramName in params) {
    const paramValue = params[paramName];
    if (paramValue !== undefined) {
      keyValues.push(`${paramName}=${paramValue}`);
    }
  }
  return `${url}?${keyValues.join('&')}`;
}

export function groupBy(array, key) {
  return array.reduce(
    (result, element) => {
      (result[element[key]] = result[element[key]] || []).push(element);
      return result;
    },
    {}
  );
};

export function commitDetailsItems(labelData) {
  return Object.keys(labelData.commitDetails)
    .map((commitDetail, index) => {
      return (
        <CommitDetailTooltipItem
          key={index}
          detailName={commitDetail}
          detailValue={labelData.commitDetails[commitDetail]}
        />
      );
    });
}

export function commitChangedClassesItems(labelData, params) {
  const {
    classToColorMapping
  } = params;
  return labelData.stacks
    .map((stackPayload, index) => {
      return (
        <TooltipCommitRangeItem
          key={index + Object.keys(labelData.commitDetails).length}
          markerColor={classToColorMapping[stackPayload.changedClassName]}
          className={stackPayload.changedClassName}
          amount={`${stackPayload.changedLinesCount} line${stackPayload.changedLinesCount > 1 ? 's were' : ' was'} changed (${stackPayload.changedLinesCountPercentage.toFixed(2)}%)`}
        />
      );
    });
}

export function commitTooltipItems(labelData, params) {
  return commitDetailsItems(labelData).concat(commitChangedClassesItems(labelData, params));
}

export function convertClassToTooltipInfo(changedClass, totalChangedLinesCountInCommit) {
  return {
    changedLinesCount: changedClass.changedLinesCount,
    changedLinesCountPercentage: changedClass.changedLinesCount / totalChangedLinesCountInCommit * 100.0,
    changedClassName: changedClass.className,
  };
}

export function convertClassToCallVolumeTooltipInfo(classData, params={}) {
  let methodNames = params.methodNames;
  if (!methodNames) {
    methodNames = classData.methods.map(method => method.methodName);
  }
  return classData.methods
    .filter(method => methodNames.includes(method.methodName))
    .map(method => {
      const calledBy = method.callers.map(callerClass => {
        return {
          className: callerClass.callerClassName,
          color: params.classToColorMapping ? params.classToColorMapping[callerClass.callerClassName] : '#000000',
          callAmount: Number(callerClass.totalCallAmount),
        };
      });

      return {
        methodName: method.methodName,
        totalCalls: calledBy.reduce((sum, caller) => sum + caller.callAmount, 0),
        calledBy,
      };
    });
}

export function buildCallVolumeItems(items) {
  return items.map(item => {
    return (
      <CallVolumeTooltipItem {...item} />
    );
  });
}

export function extractCommitDetails(commit) {
  return {
    commitMessage: commit.message,
    commitAuthor: commit.author,
    commitTime: commit.time,
    commitBranchName: commit.branchName,
  };
}

export function buildLabelData(commit) {
  return {
    commitDetails: extractCommitDetails(commit),
    commitHash: commit.commitHash,
    stacks: commit.changedClasses.map((changedClass, index) => buildStackPayload(commit, index)),
  };
}

export function buildStackPayload(commit, classIndex) {
  return {
    ...convertClassToTooltipInfo(commit.changedClasses[classIndex], commit.totalChangedLinesCount),
    commitHash: commit.commitHash,
  };
}

export function extractUniqueValues(array) {
  const cache = {};
  for (let element of array) {
    cache[element] = true;
  }
  return Object.keys(cache);
}
