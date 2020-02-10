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

//web socket set up

//player info
let players = []

let io = require('socket.io').listen(app)
io.sockets.on('connection', function(socket) {
  function log() {
    let array = ['*** Server Log Message: ']
    for (let i = 0; i < arguments.length; i++) {
      array.push(arguments[i])
      console.log(arguments[i])
    }
    socket.emit('log', array)
    socket.broadcast.emit('log', array)
  }
  log('A web site connected to the server')
  socket.on('join_room', function(payload) {
    log('Server recieved a command', 'join_room', payload)
    if ('undefined' === typeof payload || !payload) {
      let error_message = 'join_room had no payload'
      log(error_message)
      socket.emit('join_room_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let room = payload.room
    if ('undefined' === typeof room || !room) {
      let error_message = 'join_room did not specify a room'
      log(error_message)
      socket.emit('join_room_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let username = payload.username
    if ('undefined' === typeof username || !username) {
      let error_message = 'join_room did not specify a username'
      log(error_message)
      socket.emit('join_room_response', {
        result: 'fail',
        message: error_message
      })
      return
    }

    players[socket.id] = {}
    players[socket.id].username = username
    players[socket.id].room = room

    socket.join(room)

    let roomObject = io.sockets.adapter.rooms[room]
    // if ('undefined' === typeof roomObject || !roomObject) {
    //   let error_message = 'join_room did not create a room (internal error)'
    //   log(error_message)
    //   socket.emit('join_room_response', {
    //     result: 'fail',
    //     message: error_message
    //   })
    //   return
    // }
    let numClients = roomObject.length
    let success_data = {
      result: 'success',
      room: room,
      username: username,
      socket_id: socket.id,
      membership: numClients
    }
    io.in(room).emit('join_room_response', success_data)

    for (let socket_in_room in roomObject.sockets) {
      let success_data = {
        result: 'success',
        room: room,
        username: players[socket_in_room].username,
        socket_id: socket_in_room,
        mebership: numClients
      }
      socket.emit('join_room_response', success_data)
    }
    log('join_room success')
  })
  socket.on('disconnect', function(socket) {
    log('A Client disconnected from the server')
    if ('undefined' !== typeof players[socket.id] && players[socket.id]) {
      let username = players[socket.id].username
      let room = players[socket.id].room
      let payload = {
        username: username,
        socket_id: socket.id
      }
      delete players[socket.id]
      io.in(room).emit('player_disconnected', payload)
    }
  })

  socket.on('send_message', function(payload) {
    log('server received a command', 'send message', payload)
    if ('undefined' === typeof payload || !payload) {
      let error_message = 'send_message had no payload'
      log(error_message)
      socket.emit('send_message_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let room = payload.room
    if ('undefined' === typeof room || !room) {
      let error_message = 'send_message did not specify a room'
      log(error_message)
      socket.emit('send_message_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let username = payload.username
    if ('undefined' === typeof username || !username) {
      let error_message = 'send_message did not specify a username'
      log(error_message)
      socket.emit('send_message_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let message = payload.message
    if ('undefined' === typeof message || !message) {
      let error_message = 'send_message did not specify a username'
      log(error_message)
      socket.emit('send_message_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let success_data = {
      result: 'success',
      room: room,
      username: username,
      message: message
    }
  })

  //invite ***************************************************************************************************
  socket.on('invite_message', function(payload) {
    log('invite with' + JSON.stringify(payload))
    if ('undefined' === typeof payload || !payload) {
      let error_message = 'invite had no payload'
      log(error_message)
      socket.emit('invite_Sresponse', {
        result: 'fail',
        message: error_message
      })
      return
    }
    // let room = payload.room
    // if ('undefined' === typeof room || !room) {
    //   let error_message = 'send_message did not specify a room'
    //   log(error_message)
    //   socket.emit('send_message_response', {
    //     result: 'fail',
    //     message: error_message
    //   })
    //   return
    // }
    let username = players[socket.id].username
    if ('undefined' === typeof username || !username) {
      let error_message = 'invited party did not specify a username'
      log(error_message)
      socket.emit('send_message_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let requested_user = payload.requested_user
    if ('undefined' === typeof requested_user || !requested_user) {
      let error_message = 'invite did not specifiy requested user'
      log(error_message)
      socket.emit('invite_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let room = players[socket.id].room
    let roomObject = io.sockets.adapter.rooms[room]
    if (!roomObject.sockets.hasOwnProperty(requested_user)) {
      let error_message = 'invite requested user was not in the room'
      log(error_message)
      socket.emit('invite_response', {
        result: 'fail',
        message: error_message
      })
      return
    }
    let success_data = {
      result: 'success',
      socket_id: requested_user
    }
    socket.emit('invite_response', success_data)

    // let success_data = {
    //   result: 'success',
    //   socket_id: socket.id
    // }
    socket.to('requested_user').emit('invited', success_data)
    log('invite successful')
  })
})
