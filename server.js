var http = require('http');
var fs = require('fs');

var st = require('node-static');
var file = new st.Server('./static/');

http.createServer(function (request, response) {
  var bodytxt = '';
  request.on('data', function (data) {
    bodytxt += data;
    if (bodytxt.length > 1e6) {
      request.connection.destroy();
    }
  });
  request.on('end', function () {
    var baseurl = request.url.toLowerCase().split('?')[0];
    if (baseurl === '/all') {
      fs.readdir('./static/faces', function(err, files) {
        if (err) {
          throw err;
        }
        response.write(JSON.stringify(files));
        return response.end();
      });
    } else {
      file.serve(request, response);
    }
  }).resume();
}).listen(8080);
