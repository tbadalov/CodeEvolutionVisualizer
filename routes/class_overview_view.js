var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('class_overview_view', { title: 'Express' });
});

module.exports = router;
