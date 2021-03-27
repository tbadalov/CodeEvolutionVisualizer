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
        mainBranch = 'master\\\n';
      } else {
        mainBranch = branches[0];
      }
    },
    onCompleted: () => {
      const mainQuerySession = driver.session();
      const result = [];
      mainQuerySession.run(`
      MATCH (last_commit:App)
      WHERE last_commit.branch='master' OR last_commit.branch="master\\\n"
      WITH last_commit
      ORDER BY last_commit.timestamp DESC
      LIMIT 1
      MATCH (app:App)-[:CHANGED_TO*0..]->(last_commit)
      WITH distinct app
      CALL {
        WITH app
        MATCH (app)-[:APP_OWNS_CLASS]->(c:Class)
        WHERE NOT (app)<-[:CHANGED_TO]-(:App)-[:APP_OWNS_CLASS]->(c)
        OPTIONAL MATCH (:Class)-[class_changed_rel:CLASS_CHANGED_TO]->(c)
        WITH app, c.name as className, sum(class_changed_rel.added_lines+class_changed_rel.changed_lines+class_changed_rel.deleted_lines) as changedLinesCount
        WITH className, changedLinesCount
        ORDER BY className
        RETURN collect( { className: className, changedLinesCount: changedLinesCount } ) as changedClasses, sum(changedLinesCount) as totalChangedLinesCount
      }
      RETURN app.commit as commitHash, app.time as time, app.author as author, app.message as message, app.version_number as versionNumber, app.branch as branchName, changedClasses, totalChangedLinesCount
      ORDER BY app.timestamp ASC
      LIMIT 50
      `).subscribe({
        onNext: record => {
          result.push({
            commitHash: record.get('commitHash'),
            time: record.get('time'),
            author: record.get('author'),
            message: record.get('message'),
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