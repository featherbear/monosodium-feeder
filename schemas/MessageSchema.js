const mongoose = require('mongoose')
const ThreadSchema = require('./ThreadSchema')

let MessageSchema = new mongoose.Schema({
  body: String,
  timestamp: Number,
  sender: Number,
  thread: ThreadSchema,
  // account: Number,
  deleted: Boolean,
  id: String
})

MessageSchema.methods.markAsDeleted = function () {
  this.deleted = true
  this.save()
}

module.exports = MessageSchema
