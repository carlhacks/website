/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , fs = require('fs');

mongoose.connect('mongodb://localhost/carlhacks');
var db = mongoose.connection;
var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser({
  keepExtensions: true,
  uploadDir: '/tmp/uploads'
}));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('MongoDB open and ready');
});
var myDb = require('./myDb');
var User = myDb.User;
var Project = myDb.Project;

app.get('/', function(req, res){
  User.count({}, function( err, count){
    res.render('index', { title: 'CarlHacks', count: count });
  })
});

app.get('/count', function(req, res){
  User.count({}, function( err, count){
    res.send({ count: count });
  })
});

app.get('/users', function (req, res){
  if (req.url==='/users?password=carlhacks9000'){
    User.find({}, function (error, users){
      if (error) console.log("error!");
      res.render('usersList.jade', {
        title: 'Users',
        users: users,
      });
    });
  }else{
    res.redirect('/');
  }
});

app.post('/users/new', function (req, res) {
  var user = new User({
      name: req.body.user.name,
      email: req.body.user.email,
      bracket: req.body.user.bracket,
      needTeam: req.body.user.need_team, 
      teamName: req.body.user.team_name, 
      teamMates: req.body.user.team_members
  });
  user.save(function (error, user) {
    if(error) console.log("error!");
  });
  res.redirect('/');
})



app.get('/submit', function (req, res) {
  res.render('submit.jade', {
    title: 'Submit'
  });
});

// File upload
app.post('/upload', function(req, res) {
  console.log('Received image upload: %s saved to %s',
    req.files.image.name,
    req.files.image.path);
});

// File upload
app.post('/project', function(req, res) {
  var image = {url: req.files.image.path.replace("/","__"),
               contentType: req.files.image.type};
  var project = new Project({
      tname: req.body.project.tname,
      tmems: req.body.project.tmems,
      techs: req.body.project.techs,
      bracket: req.body.project.bracket,
      description: req.body.project.description,
      img: image
  });
  project.save(function (error, project) {
    if(error) console.log("error!");
  });
  res.redirect('/');
});

app.get('/projects', function (req, res){
  Project.find({}, function (error, projects){
    if (error) console.log("error!");
    res.render('projectList.jade', {
      title: 'projects',
      projects: projects
    });
  });
});

app.get('/imgs/:imgPath', function(req, res) {
  var path = '/var/tmp/' + req.params.imgPath.replace("__","/");
  if(fs.existsSync(path)){
    imgData = fs.readFileSync(path);
    res.send(imgData);
  }else{
    res.send('', 404);
  };
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
