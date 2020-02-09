//functions for general use

function getURLParameters(whichParam) {
  let pageURL = window.location.search.substring(1)
  let pageURLVariables = pageURL.split('&')
  for (let i = 0; i < pageURLVariables.length; i++) {
    let parameterName = pageURLVariables[i].split('=')
    if (parameterName[0] == whichParam) {
      return parameterName[1]
    }
  }
}

//$('#messages').append('<h4>' + getURLParameters('username') + '</h4>')

const username = getURLParameters('username')
if ('undefined' == typeof username || !username) {
  username = 'Anonymous_' + Math.random()
}

let chat_room = getURLParameters('one_room')
if ('undefined' == typeof chat_room || !chat_room) {
  chat_room = 'lobby'
}

let socket = io.connect()

socket.on('log', function(array) {
  console.log.apply(console, array)
})

socket.on('join_room_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message)
    return
  }
  if (payload.socket_id == socket.id) {
    return
  }
  let dom_elements = $('.socket_' + payload.socket_id)
  if (dom_elements.length == 0) {
    let nodeA = $('<div></div>')
    nodeA.addClass('socket_' + payload.socket_id)
    let nodeB = $('<div></div>')
    nodeB.addClass('socket_' + payload.socket_id)
    let nodeC = $('<div></div>')
    nodeC.addClass('socket_' + payload.socket_id)

    nodeA.addClass('w-100')

    nodeB.addClass('col-9 text-right')
    nodeB.append('<h4>' + payload.username + '</h4>')

    nodeC.addClass('col-3 text-left')
    let buttonC = makeInviteButton()
    nodeC.append(buttonC)

    nodeA.hide()
    nodeB.hide()
    nodeC.hide()
    $('#players').append(nodeA, nodeB, nodeC)
    nodeA.slideDown(1000)
    nodeB.slideDown(1000)
    nodeC.slideDown(1000)
  } else {
    let buttonC = makeInviteButton()
    $('.socket_' + payload.socket_id + 'button').replaceWith(buttonC)
    dom_elements.slideDown(1000)
  }

  let newHTML = '<p>' + payload.username + ' ' + ' just entered the lobby </p>'
  let newNode = $(newHTML)
  newNode.hide()
  $('#messages').append(newNode)
  newNode.slideDown(1000)

  $('#messages').append(
    '<p> New user joined the room: ' + payload.username + '</p>'
  )
})

socket.on('send_message_response', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message)
    return
  }
  $('#messages').append(
    '<p><b>' + payload.username + 'says:</b>' + payload.message + '</p>'
  )
})

socket.on('player_disconnected', function(payload) {
  if (payload.result == 'fail') {
    alert(payload.message)
    return
  }
  if (payload.socket_id == socket.id) {
    return
  }
  let dom_elements = $('.socket_' + payload.socket_id)
  if (dom_elements.length != 0) {
    dom_elements.slideUp(1000)
  }

  let newHTML = '<p>' + payload.username + 'just left the lobby </p>'
  let newNode = $(newHTML)
  newNode.hide()
  $('#messages').append(newNode)
  newNode.slideDown(1000)

  $('#messages').append(
    '<p> New user joined the room: ' + payload.username + '</p>'
  )
})

function send_message() {
  let payload = {}
  payload.room = chat_room
  payload.username = username
  payload.message = $('#send_message_holder').val()
  console.log(
    "*** Client Log Message: 'send_message' payload: " + JSON.stringify()
  )
  socket.emit('send_message', payload)
}

function makeInviteButton() {
  let newHTML =
    "<button type = 'button' class = 'btn-outline-primary'></button>"
  let newNode = $(newHTML)
  return newNode
}

$(function() {
  let payload = {}
  payload.room = chat_room
  payload.username = username

  console.log(
    "*** client log message: 'join_room' payload: " + JSON.stringify(payload)
  )
  socket.emit('join_room', payload)
})
