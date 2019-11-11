const mongoose = require('mongoose')

const { Schemas } = require('../monosodium-commons')

module.exports = {
  Message: mongoose.model('messages', Schemas.MessageSchema),
  Thread: mongoose.model('threads', Schemas.ThreadSchema)
}
