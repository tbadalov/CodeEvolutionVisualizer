var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  const query = `
  MATCH (origin:App)
    WHERE origin.commit = '` + req.query.startCommit + `'
  MATCH (intermediate_commit:App)-[:CHANGED_TO*0..]->(destination:App)
    WHERE intermediate_commit.timestamp >= origin.timestamp
      AND intermediate_commit.timestamp <= destination.timestamp
      AND destination.commit='` + req.query.endCommit + `'
  WITH intermediate_commit as app
  OPTIONAL MATCH (app)-[APP_OWNS_CLASS]->(c:Class)-[:CLASS_OWNS_METHOD]->(m:Method)
    WHERE c.name = '` + req.query.className +`'
  OPTIONAL MATCH (app)<-[:CHANGED_TO]-(previousApp:App)-[:APP_OWNS_CLASS]->(:Class)-[:CLASS_OWNS_METHOD]->(m)
  OPTIONAL MATCH (m)-[changed_to:CHANGED_TO]->(new_method:Method)
  OPTIONAL MATCH (m)<-[changed_from:CHANGED_TO]-(old_method:Method)
  OPTIONAL MATCH (m)-[calles:CALLS]-(called_method:Method)
  WITH app,
    CASE
      WHEN m IS NULL THEN NULL
      WHEN previousApp IS NOT NULL THEN 'same'
      WHEN old_method IS NULL THEN 'new'
      ELSE 'changed'
    END as status,
      m,
    previousApp,
    new_method,
    old_method,
    collect(called_method.name) as calls
  RETURN app.commit as commitHash,
    app.branch as branchName,
    app.timestamp as timestamp,
    app.version_number as version,
    CASE
      WHEN m IS NULL THEN []
      ELSE collect({status: status, name: m.name, calls: calls})
    END as methods
  ORDER BY timestamp ASC`;
  console.log(query);
  session.run(query).subscribe({
    onNext: record => {
      dataFromDb.push({
        commitHash: record.get('commitHash'),
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
    MATCH (origin_commit:App), (destination_commit:App)
    WHERE origin_commit.commit='` + req.query.startCommit + `'
      AND destination_commit.commit='` + req.query.endCommit + `'
    MATCH (app:App)-[:CHANGED_TO*0..]->(destination_commit)
    WHERE app.timestamp >= origin_commit.timestamp
    OPTIONAL MATCH (app)-[:APP_OWNS_CLASS]->(c:Class)
    RETURN collect(distinct c.name) as classNames, collect(distinct {branchName: app.branch, commitHash: app.commit}) as commits`;
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
