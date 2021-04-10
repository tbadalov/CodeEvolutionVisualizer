var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  let dataFromDb = {};
  const query = `
  MATCH (app:App)-[:APP_OWNS_CLASS]->(class:Class)-[:CLASS_OWNS_METHOD]->(m:Method)
  WHERE app.commit='` + req.query.commit + `'
  OPTIONAL MATCH (caller_class:Class)-[:CLASS_OWNS_METHOD]->(caller:Method)-[:CALLS]->(m)
    WHERE (app)-[:APP_OWNS_CLASS]->(caller_class)
  WITH class,
    m,
    caller_class,
    caller.name as caller_name,
    count(caller) as number_of_calls
  WITH class,
    m,
    caller_class,
    collect({callerMethodName: caller_name, number_of_calls: toString(number_of_calls)}) as caller_methods,
    sum(number_of_calls) as total_calls
  WITH class,
    m,
    CASE
      WHEN caller_class IS NULL THEN []
      ELSE collect({
        callerClassName: caller_class.name,
        totalCalls: toString(total_calls),
        callerMethods: caller_methods
      })
    END as callers,
    sum(total_calls) as total_calls
  WITH class.name as className,
    collect({
      methodName: m.name,
      totalCalls: toString(total_calls),
      callers: callers
    }) as methods
  RETURN collect({
    className: className,
    methods: methods
  }) as classes
  `;
  console.log(query);
  session.run(query).subscribe({
    onNext: record => {
      dataFromDb = record.get('classes');
    },
    onCompleted: () => {
      console.log(dataFromDb);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(dataFromDb));
    }
  });
});

router.get('/class_names', (req, res, next) => {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  session.run(`
    MATCH (app:App)-[:APP_OWNS_CLASS]->(c:Class)
    WHERE app.commit='` + req.query.commit + `'
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

module.exports = router;
