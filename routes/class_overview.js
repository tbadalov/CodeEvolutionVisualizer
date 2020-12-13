var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  session.run(`
    MATCH (app:App)-[APP_OWNS_CLASS]->(c:Class)-[:CLASS_OWNS_METHOD]->(m:Method)
    WHERE c.name = '` + req.query.className + `' AND app.branch = '` + req.query.branch + `' AND app.version_number >= ` + req.query.startVersion + ` AND app.version_number <= ` + req.query.endVersion + `
    OPTIONAL MATCH (previousApp:App)-[:CHANGED_TO]->(app), (previousApp)-->(:Class)-->(m)
    OPTIONAL MATCH (m)-[changed_to:CHANGED_TO]->(new_method:Method)
    OPTIONAL MATCH (m)<-[changed_from:CHANGED_TO]-(old_method:Method)
    OPTIONAL MATCH (m)-[called:CALLED]-(called_method:Method)
    RETURN app.commit as commit,
      app.version_number as version,
        CASE
          WHEN previousApp IS NOT NULL THEN 'same'
          WHEN old_method IS NULL THEN 'new'
          ELSE 'changed'
        END as status,
        m,
        new_method,
        called,
        collect(called_method.name) as calls
        ORDER BY version
  `).subscribe({
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
    }
  })
})

module.exports = router
