var client = require("./redis-vcap").client;
var express = require('express'),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    app = express.createServer();

app.configure(function() {
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.static(path.join(__dirname, '/public')));
  app.set('view engine', 'ejs');
  app.set("view options", { layout: false })
});

app.get('/', function(req, res){
  res.render('index.ejs');
});

app.get('/images', function(req, res){
  res.contentType('json');
  // this is the type of return we want
      //'id' : {
      //    thumb: 'image.jpg',
      //    image: 'image.jpg',
      //    big: 'image.jpg',
      //    title : "name",
      //    description: "project"
      //}
  var images = [];
  client.zrevrange("timestamps:commits", 0, -1, function(err, replies) {
    console.log("replies", replies);
    console.log("err", err);
    if (replies) {
      res.send(replies);
    }
  });
  return;
  client.smembers("all:commits", function(err, replies) {
    console.log("replies", replies);
    res.send(replies);
  });

});

app.post('/commit', function(req, res, next){

  //console.dir(req.body);

  try {
    var date = new Date();

    var multi = client.multi();

    console.log("name", JSON.stringify(req.body.name));
    console.log("email", JSON.stringify(req.body.email));
    console.log("project", JSON.stringify(req.body.project));
    console.log("commit", JSON.stringify(req.body.commit));

    console.log('photo ', req.files.photo);

    var tmp = req.files.photo.path;
    var pub = path.join(__dirname, "/public/gitshots/", req.body.commit + ".jpg");

    // fs.copy
    fs.stat(tmp, function (err) {
      if (err) {
        throw (err);
      }
      is = fs.createReadStream(tmp);
      os = fs.createWriteStream(pub);
      util.pump(is, os, function(err) {
        if (err) {
          throw (err);

          multi.hmset("person:" + req.body.email,
                      "email", req.body.email,
                      "name", req.body.name);

          multi.sadd("all:commits", req.body.commit);
          multi.sadd("commits:person:" + req.body.email, req.body.commit);

          multi.sadd("all:projects", req.body.project);
          multi.sadd("projects:person:" + req.body.email, req.body.project);
          multi.sadd("projects:commit:" + req.body.commit, req.body.project);

          // commit breakdown on timestamp
          multi.zadd("timestamps:commits", date.getTime(), req.body.commit);

          // commits breakdown by dates
          multi.sadd("date:commits:" + date.getFullYear(), req.body.commit);
          multi.sadd("date:commits:" + date.getFullYear() + ":" + date.getMonth(), req.body.commit);
          multi.sadd("date:commits:" + date.getFullYear() + ":" + date.getMonth() + ":" + date.getDate(), req.body.commit);

          multi.exec(function reply(err, replies) {
            if (err) {
              console.error(err);
            }
          });

        }
      });
    });

    res.send("success");
  } catch (error) { console.error(error); throw error; }

});

var __port = process.env.VCAP_APP_PORT || 8080
console.log("listening on http://" + require("os").hostname() + ":" + __port + "/");
app.listen(__port);
