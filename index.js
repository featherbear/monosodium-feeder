require('dotenv').config()

const { mongoConnection, facebookUsername, facebookPassword } = process.env

if (!mongoConnection) throw new Error('MongoDB connection URI not supplied!')
if (!facebookUsername) throw new Error('Facebook username not supplied!')
if (!facebookPassword) throw new Error('Facebook password not supplied!')

const spawnClient = require('./spawnClient')
const mongoose = require('mongoose')

async function go () {
  try {
    console.log('Connecting to MongoDB')
    await mongoose.connect(
      mongoConnection,
      function (err) {
        if (err) {
          throw new Error('Could not connect to MongoDB')
        }

        console.log('Connected to MongoDB')
      }
    )

    let credentials = {
      username: facebookUsername,
      password: facebookPassword
    }

    const { Message, Thread } = require('./models')

    let bot = spawnClient(credentials).then(bot => {
      bot.on('data', function (data) {
        //   this.findOne({id: data.threadID}, (err, result) => {
        //     return result
        //       ? callback(err, result)
        //       : self.create(condition, (err, result) => {
        //         return callback(err, result)
        //       })
        //   })
        // }

        switch (data.type) {
          case 'message':
            console.log(data)

            Message.create({
              body: data.body,
              timestamp: data.timestamp,
              sender: data.senderID,
              id: data.messageID
              // thread: ThreadSchema,
            })
            return
          case 'message_unsend':
            Message.findOne({ id: data.messageID }, (err, msg) => {
              if (err) {
                console.error(err)
                return
              }

              msg.markAsDeleted()
            })
            return

          case 'event':

          case 'message_reply':
          case 'message_reaction':
            console.log(data)
            return

          case 'read_receipt':
          case 'read':
          case 'typ':
          case 'presence':
            return

          default:
            console.log('Expected event type: ' + data.type)
        }
      })
    })
  } catch (err) {
    console.log(err)
    throw err
  }
}

go()
