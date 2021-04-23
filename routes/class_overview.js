var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  const query = `
  MATCH (app:App {name: '` + req.query.applicationName +`'})
    WHERE app.commit IN [` + req.query.selectedCommitHashes.split(',').map(selectedCommitHash => `"${selectedCommitHash}"`).join(',') + `]
  OPTIONAL MATCH (app)-[APP_OWNS_CLASS]->(c:Class)-[:CLASS_OWNS_METHOD]->(m:Method)
    WHERE c.name = '` + req.query.className +`'
  OPTIONAL MATCH (app)<-[:CHANGED_TO]-(previousApp:App)-[:APP_OWNS_CLASS]->(:Class)-[:CLASS_OWNS_METHOD]->(m)
  OPTIONAL MATCH (mergedApp:App {name: "` + req.query.applicationName + `"})
    WHERE (mergedApp)-[:CHANGED_TO]->(app)<-[:CHANGED_TO]-(:App)
      AND mergedApp.branch <> app.branch
  OPTIONAL MATCH (m)-[changed_to:CHANGED_TO]->(new_method:Method)
  OPTIONAL MATCH (m)<-[changed_from:CHANGED_TO]-(old_method:Method)
  OPTIONAL MATCH (m)-[:CALLS]->(called_method:Method)<-[:CLASS_OWNS_METHOD]-(c)
  WITH app,
    m,
    CASE
      WHEN m IS NULL THEN NULL
      WHEN previousApp IS NOT NULL THEN 'same'
      WHEN old_method IS NULL THEN 'new'
      ELSE 'changed'
    END as status,
    collect(distinct mergedApp.branch) as merged_branches,
    collect(distinct called_method.name) as calls
  WITH app.commit as commitHash,
    app.branch as branchName,
    app.author_timestamp as timestamp,
    app.version_number as version,
    m.name as methodName,
    merged_branches,
    status,
    calls
  RETURN commitHash,
    branchName,
    timestamp,
    version,
    merged_branches,
    CASE
      WHEN methodName IS NULL THEN []
      ELSE collect({status: status, name: methodName, calls: calls})
    END as methods
  ORDER BY toInteger(timestamp) ASC`;
  console.log(query);
  session.run(query).subscribe({
    onNext: record => {
      dataFromDb.push({
        commitHash: record.get('commitHash'),
        mergedBranchNames: record.get('merged_branches'),
        branchName: record.get('branchName'),
        version: record.get('version').low,
        timestamp: record.get('timestamp'),
        methods: record.get('methods'),
      });
    },
    onCompleted: () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(dataFromDb));
    },
  })
});

router.get('/initial_data', (req, res, next) => {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  let dataFromDb = {
    classNames: [],
    commits: [],
  };
  const query = `
    MATCH (app:App {name: "` + req.query.applicationName + `"})
    WHERE app.commit IN [` + req.query.selectedCommitHashes.split(',').map(selectedCommitHash => `"${selectedCommitHash}"`).join(',') + `]
    OPTIONAL MATCH (app)-[:APP_OWNS_CLASS]->(c:Class)
    RETURN collect(distinct c.name) as classNames, collect(distinct {branchName: app.branch, commitHash: app.commit}) as commits`;
  console.log(query);
  session.run(query).subscribe({
    onNext: record => {
      dataFromDb = {
        classNames: record.get('classNames'),
        commits: record.get('commits'),
      };
    },
    onCompleted: () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(dataFromDb));
    },
  });
});

module.exports = router
