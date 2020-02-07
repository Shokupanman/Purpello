const static = require('node-static')
const http = require('http')

//! If on Heroku
let port = process.env.PORT
let directory = __dirname + '/public'

//? Not on Heroku?
if (typeof port === 'undefined' || !port) {
  directory = './public'
  port = 8080
}

// Static web-server
let file = new static.Server(directory)

//construct http server
let app = http
  .createServer(function(request, response) {
    request
      .addListener('end', function() {
        file.serve(request, response)
      })
      .resume()
  })
  .listen(port)
console.log('server is up')
