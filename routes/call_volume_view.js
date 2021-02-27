var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('call_volume_view', { title: 'Express' });
});

module.exports = router;
