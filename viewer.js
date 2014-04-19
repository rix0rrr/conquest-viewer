var express = require('express');
var fs = require('fs');
var http = require('http');

var app    = express()
    server = http.createServer(app);

app.use(require('errorhandler')({ dumpExceptions: true, showStack: true }));

//app.get('/', function(req, res) {
    //var filePath = path.join(__dirname, 'myfile.mp3');
    //var stat = fileSystem.statSync(filePath);

    //response.writeHead(200, {
        //'Content-Type': 'audio/mpeg',
        //'Content-Length': stat.size
    //});    res.send('<html><body><ul><li><a href="/view/view.html">View board</a></li><li><a href="/post/post.html">Send card</a></ul>');
    //var readStream = fs.createReadStream(filePath);
    //// We replaced all the event handlers with a simple call to readStream.pipe()
    //readStream.pipe(response);
//});

var oneDay = 24 * 60 * 60 * 1000;
app.use(express.static('www', { maxAge: oneDay }));
app.use('/logs', express.static('logs'));

app.get('/list', function(req, res) {
    fs.readdir('logs', function(err, files) {
        if (err)
            res.send(err);
        else {
            files.sort();
            res.send(files.join('\n'));
        }
    });
});

server.listen(3000);
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
