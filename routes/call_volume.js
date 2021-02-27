var neo4j = require('neo4j-driver');
var express = require('express');
var neo4jconfig = require('../neo4jconfig');
var router = express.Router();

router.get('/', function(req, res, next) {
  const driver = neo4j.driver(neo4jconfig.uri, neo4j.auth.basic(neo4jconfig.user, neo4jconfig.password));
  const session = driver.session();
  const dataFromDb = [];
  session.run(`
    MATCH (app:App)-[:APP_OWNS_CLASS]->(class:Class)-[:CLASS_OWNS_METHOD]->(m:Method)
    WHERE app.commit='` + req.query.commit + `'
    WITH class, m, toInteger(rand() * 10) as callAmount
    RETURN class.name as className, collect({ method: m.name, callAmount: callAmount }) as calledMethods, sum(callAmount) as totalCallAmount
    ORDER BY totalCallAmount
  `).subscribe({
    onNext: record => {
      dataFromDb.push({
        class: record.get('className'),
        methods: record.get('calledMethods').map(calledMethod => { calledMethod.callAmount = calledMethod.callAmount.low; return calledMethod; }),
        totalCallAmount: record.get('totalCallAmount').low,
      })
    },
    onCompleted: () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(dataFromDb));
    }
  });
});

module.exports = router;
