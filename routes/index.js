var express = require('express');
var multer  = require('multer');
var AdmZip = require('adm-zip');
var upload = multer({ dest: 'uploads/' })
const { exec } = require('child_process');
const { Docker } = require('node-docker-api');
const { default: container } = require('node-docker-api/lib/container');
var docker = new Docker({socketPath: '/var/run/docker.sock'});
var router = express.Router();

/*const promisifyStream = stream => new Promise((resolve, reject) => {
  stream.on('data', data => console.log(data.toString()))
  stream.on('end', resolve)
  stream.on('error', reject)
});*/

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.session.container);
  res.render('index', { title: 'Express' });
});

/* POST home page. */
router.post('/', upload.single('neo4jdb'), function(req, res, next) {
  console.log(req.file.originalname);
  console.log(req.file.mimetype);
  console.log(req.file.path);
  console.log(req.session);
  console.log(req.sessionID);
  

  const outputFolder = process.env.PWD + "/session_data/" + req.sessionID + "/databases/graph.db";

	// reading archives
  var zip = new AdmZip(req.file.path);
  zip.extractAllToAsync(/*target path*/outputFolder, /*overwrite*/true, unzipError => {
    docker.container
      .create({
        Image: 'neo4j:3.5.25',
        name: "neo4j_" + req.sessionID,
        AttachStdin: false,
        AttachStdout: false,
        AttachStderr: false,
        "Env": [
          "NEO4J_AUTH=neo4j/testneo4j"
        ],
        "ExposedPorts": {
          "7474/tcp": {},
          "7687/tcp": {},
        },
        HostConfig: {
          "Binds": [
            outputFolder + ":/data",
          ],
          PortBindings: {},
          NetworkMode: "neo4jnet",
        },
        Cmd: null,
      }).then(container => { console.log(container.id); let st = container.start(); console.log(st); return st; })
      .then(container => {
        console.log("started...");
        console.log(container);
        req.session.container = { id: container.id, name: "neo4j_" + container.id};
        req.session.save();
        return container;
      })
      .catch(error => { console.log("yep"); console.log(error) });
  });
  res.render('index', { title: 'Express' });
});


module.exports = router;
