const mongoose = require('mongoose')

const schemas = require('./schemas')

module.exports = {
  Message: mongoose.model('messages', schemas.MessageSchema),
  Thread: mongoose.model('threads', schemas.ThreadSchema)
}
