var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
const { application } = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  let mainApp;
  let applications;
  session.run(`
    MATCH (app:App)
    RETURN collect(distinct app.name) as applications
  `).subscribe({
    onNext: record => {
      applications = record.get("applications");
      mainApp = applications[1];
    },
    onCompleted: () => {
      const mainQuerySession = driver.session();
      const result = [];
      const selectedApp = req.query.applicationName || mainApp;
      mainQuerySession.run(`
      MATCH (last_commit:App {name: "` + selectedApp + `"})
      WHERE last_commit.branch='master'
        OR last_commit.branch="master\\\\\\n"
      WITH last_commit
      ORDER BY toInteger(last_commit.author_timestamp) DESC
      LIMIT 1
      MATCH (app:App {name: "` + selectedApp + `"})
      WHERE (app)-[:CHANGED_TO*0..]->(last_commit)
      WITH distinct app
      CALL {
        WITH app
        MATCH (app)-[:APP_OWNS_CLASS]->(c:Class)
        WHERE NOT (app)<-[:CHANGED_TO]-(:App)-[:APP_OWNS_CLASS]->(c)
        OPTIONAL MATCH (:Class)-[class_changed_rel:CLASS_CHANGED_TO]->(c)
        WITH app,
          c.name as className,
          CASE
            WHEN class_changed_rel IS NULL THEN c.number_of_lines
            ELSE sum(class_changed_rel.added_lines+class_changed_rel.changed_lines+class_changed_rel.deleted_lines)
          END as changedLinesCount
        WITH className, changedLinesCount
        ORDER BY className
        RETURN collect( { className: className, changedLinesCount: changedLinesCount } ) as changedClasses, sum(changedLinesCount) as totalChangedLinesCount
      }
      RETURN app.commit as commitHash, app.author as author, app.message as message, app.version_number as versionNumber, app.branch as branchName, changedClasses, totalChangedLinesCount
      ORDER BY toInteger(app.author_timestamp) ASC
      `).subscribe({
        onNext: record => {
          result.push({
            commitHash: record.get('commitHash'),
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
            applications: applications,
            selectedApplication: mainApp,
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