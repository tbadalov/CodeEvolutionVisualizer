var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  const query = `
  MATCH (last_commit:App {name: "` + req.query.applicationName + `"})
    WHERE last_commit.branch='master' OR last_commit.branch="master\\\\\\n"
  WITH last_commit
  ORDER BY last_commit.timestamp DESC
  LIMIT 1
  MATCH (origin:App {name: "` + req.query.applicationName + `"})
    WHERE origin.commit = '` + req.query.startCommit + `'
  WITH last_commit, origin
  LIMIT 1
  MATCH (destination:App {name: "` + req.query.applicationName + `"})
    WHERE destination.commit = '` + req.query.endCommit + `'
  WITH last_commit, origin, destination
  LIMIT 1
  MATCH (intermediate_commit:App {name: "` + req.query.applicationName + `"})
    WHERE toInteger(intermediate_commit.author_timestamp) >= toInteger(origin.author_timestamp)
      AND toInteger(intermediate_commit.author_timestamp) <= toInteger(destination.author_timestamp)
      AND (intermediate_commit)-[:CHANGED_TO*0..]->(last_commit)
  WITH distinct intermediate_commit as app
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
    MATCH (last_commit:App {name: "` + req.query.applicationName + `"})
      WHERE last_commit.branch='master' OR last_commit.branch="master\\\\n"
    WITH last_commit
    ORDER BY last_commit.author_timestamp DESC
    LIMIT 1
    MATCH (origin_commit:App {name: "` + req.query.applicationName + `"})
      WHERE origin_commit.commit = '` + req.query.startCommit + `'
    WITH last_commit, origin_commit
    LIMIT 1
    MATCH (destination_commit:App {name: "` + req.query.applicationName + `"})
      WHERE destination_commit.commit = '` + req.query.endCommit + `'
    WITH last_commit, origin_commit, destination_commit
    LIMIT 1
    MATCH (app:App {name: "` + req.query.applicationName + `"})
    WHERE toInteger(app.author_timestamp) >= toInteger(origin_commit.author_timestamp)
      AND toInteger(app.author_timestamp) <= toInteger(destination_commit.author_timestamp)
      AND (app)-[:CHANGED_TO*0..]->(last_commit)
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
