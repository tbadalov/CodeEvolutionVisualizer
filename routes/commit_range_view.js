var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.session.container);
  res.render('commit_range_view', { title: 'Express' });
});

module.exports = router;
