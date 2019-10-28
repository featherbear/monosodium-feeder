require('dotenv').config()

const { mongoConnection, facebookUsername, facebookPassword } = process.env

if (!mongoConnection) throw new Error('MongoDB connection URI not supplied!')
if (!facebookUsername) throw new Error('Facebook username not supplied!')
if (!facebookPassword) throw new Error('Facebook password not supplied!')

const spawnClient = require('./spawnClient')

async function go () {
  try {
    var mongoose = require('mongoose')

    console.log('Connecting to MongoDB')
    await mongoose.connect(
      mongoConnection,
      function (err) {
        if (err) {
          throw new Error("Could not connect to MongoDB")
        }

        console.log('Connected to MongoDB')
      }
    )

    var MessageSchema = new mongoose.Schema({
      body: String,
      timestamp: Number,
      sender: Number,
      thread: Number,
      account: Number
    })

    var Message = mongoose.model('Message', MessageSchema)

    let credentials = {
      username: facebookUsername,
      password: facebookPassword
    }

    let bot = spawnClient(credentials).then(bot =>
      bot.on('event', function (data) {
        new Message(data).save()
      })
    )
  } catch (err) {
    console.log(err)
    throw err
  }
}

go()