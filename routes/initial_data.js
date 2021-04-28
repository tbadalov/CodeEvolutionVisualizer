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
    RETURN collect(distinct {
        applicationName: app.name,
        repositoryUrl: replace(app.repository_url, ".git", "")
    }) as applications
  `).subscribe({
    onNext: record => {
      applications = record.get("applications");
      mainApp = applications[1].applicationName;
    },
    onCompleted: () => {
      session.close();
      const result = JSON.stringify({
        applications: applications,
        selectedApplication: mainApp,
      });
      console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.end(result);
    },
  });
});

module.exports = router;
