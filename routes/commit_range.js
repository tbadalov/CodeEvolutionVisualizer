var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  let mainBranch;
  let branches;
  session.run(`
    MATCH (app:App)
    RETURN collect(distinct app.branch) as branches
  `).subscribe({
    onNext: record => {
      branches = record.get("branches");
      if (branches.includes('main')) {
        mainBranch = 'main'
      } else if (branches.includes('master')) {
        mainBranch = 'master';
      } else {
        mainBranch = branches[0];
      }
    },
    onCompleted: () => {
      const mainQuerySession = driver.session();
      const result = [];
      mainQuerySession.run(`
        MATCH (app:App)
        WHERE app.branch='` + mainBranch + `'
        CALL {
          MATCH (c:Class)
            WITH distinct c.name as className, toInteger(RAND() * 10) as changedLinesCount, RAND() * 100 as randomOrder
            ORDER BY randomOrder
            WHERE changedLinesCount > 0
            WITH className, changedLinesCount
          LIMIT (toInteger(RAND() * 10) + 1)
          WITH className, changedLinesCount
          ORDER BY changedLinesCount
          RETURN collect( { className: className, changedLinesCount: changedLinesCount } ) as changedClasses, sum(changedLinesCount) as totalChangedLinesCount
        }
        RETURN app.commit as commitHash, app.version_number as versionNumber, app.branch as branchName, changedClasses, totalChangedLinesCount
        ORDER BY app.version_number
      `).subscribe({
        onNext: record => {
          result.push({
            commitHash: record.get('commitHash'),
            versionNumber: record.get('versionNumber').low,
            branchName: record.get('branchName'),
            changedClasses: record.get('changedClasses').map(changedClass => {
              changedClass.changedLinesCount = changedClass.changedLinesCount.low;
              return changedClass;
            }),
            totalChangedLinesCount: record.get('totalChangedLinesCount').low,
          });
        },
        onCompleted: () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            branches: branches,
            selectedBranch: mainBranch,
            commits: result,
          }));
        }
      })
    }
  });
});

module.exports = router;


/*
MATCH (c:Class)
WITH distinct c.name as className, toInteger(RAND() * 10) as changedLinesCount, RAND() * 100 as randomOrder
ORDER BY randomOrder
WHERE changedLinesCount > 0
WITH className, changedLinesCount
LIMIT (toInteger(RAND() * 10) + 1)
RETURN { className: className,clc: changedLinesCount }
ORDER BY changedLinesCount
*/