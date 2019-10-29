const mongoose = require('mongoose')

let ThreadSchema = new mongoose.Schema({
  threadID: Number,
  threadName: String,
  members: [Number]
})

module.exports = ThreadSchema
