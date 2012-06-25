var client = require("./redis-vcap").client;
var express = require('express'),
    app = express.createServer();

app.use(express.bodyParser());
app.use(express.errorHandler({ showStack: true }));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index.ejs', { layout: false });
});

app.post('/commit', function(req, res, next){

  //console.dir(req.body);

  try {
    var date = new Date();

    var multi = client.multi();

    console.log("name", JSON.stringify(req.body.name));
    console.log("email", JSON.stringify(req.body.email));

    console.log('photo ', req.files.photo);

    res.send("");
  } catch (error) { console.error(error); }

});

var __port = process.env.VCAP_APP_PORT || 8080
console.log("listening on http://" + require("os").hostname() + ":" + __port + "/");
app.listen(__port);
