export function largestCommitSize(commits) {
  return commits.reduce((max, commit) => Math.max(max, commit.totalChangedLinesCount), 0);
}
