var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  const query = `
  MATCH p=(origin:App)-[:CHANGED_TO*]->(destination:App)
  WHERE origin.commit='` + req.query.startCommit + `' AND destination.commit='` +req.query.endCommit + `' AND all(x IN nodes(p) WHERE x.branch="master" OR x.branch="master\\\n")
  WITH p LIMIT 1
  WITH nodes(p) as path_nodes
  UNWIND(path_nodes) as app
  MATCH (app)-[APP_OWNS_CLASS]->(c:Class)-[:CLASS_OWNS_METHOD]->(m:Method)
      WHERE c.name = '` + req.query.className + `'
      OPTIONAL MATCH (app)<-[:CHANGED_TO]-(previousApp:App {branch:"master\\\n"})-[:APP_OWNS_CLASS]->(:Class)-[:CLASS_OWNS_METHOD]->(m)
      OPTIONAL MATCH (m)-[changed_to:CHANGED_TO]->(new_method:Method)
      OPTIONAL MATCH (m)<-[changed_from:CHANGED_TO]-(old_method:Method)
      OPTIONAL MATCH (m)-[calles:CALLES]-(called_method:Method)
      RETURN app.commit as commit,
        app.version_number as version,
          CASE
            WHEN previousApp IS NOT NULL THEN 'same'
            WHEN old_method IS NULL THEN 'new'
            ELSE 'changed'
          END as status,
          m,
          new_method,
          collect(called_method.name) as calls
          ORDER BY version
  `;
  console.log(query);
  session.run(query).subscribe({
    onNext: record => {
      dataFromDb.push({
        commit: record.get('commit'),
        version: record.get('version').low,
        status: record.get('status'),
        method: record.get('m').properties.name,
        calls: record.get('calls'),
      })
    },
    onCompleted: () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(dataFromDb));
    },
  })
});

router.get('/class_names', (req, res, next) => {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  session.run(`
    MATCH p=(origin:App)-[:CHANGED_TO*]->(destination:App)
    WHERE origin.commit='` + req.query.startCommit + `' AND destination.commit='` +req.query.endCommit + `' AND all(x IN nodes(p) WHERE x.branch="master\\\n" OR x.branch='master')
    WITH p LIMIT 1
    MATCH (app:App)-[:APP_OWNS_CLASS]->(c:Class)
    WHERE app IN nodes(p)
    RETURN distinct c.name as className
    ORDER BY className
  `).subscribe({
    onNext: record => {
      dataFromDb.push(record.get('className'));
    },
    onCompleted: () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(dataFromDb));
    },
  });
});

module.exports = router
