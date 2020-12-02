var express = require('express');
const { exec } = require('child_process');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST home page. */
router.post('/', function(req, res, next) {
  let firstName = req.body.firstname;
  exec('sleep 10', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
  
    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
  
  res.render('index', { title: 'Express' });
});


module.exports = router;
