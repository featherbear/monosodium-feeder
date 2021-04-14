require('dotenv').config()

const { mongoConnection, facebookUsername, facebookPassword } = process.env

if (!mongoConnection) throw new Error('MongoDB connection URI not supplied!')
if (!facebookUsername) throw new Error('Facebook username not supplied!')
if (!facebookPassword) throw new Error('Facebook password not supplied!')

const spawnClient = require('./lib/spawnClient')
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
      let cache = {}

      bot.on('data', async function (data) {
        let threadID = data.threadID
        let threadObj

        if (!(threadID in cache)) {
          threadObj = await Thread.findOne({ id: threadID })
          if (!threadObj) {
            threadObj = await Thread.create({ id: threadID })
            bot.api.getThreadInfo(threadID, function (err, response) {
              // response.threadName || response.name
              // response.participantsIDs
            })
          }

          cache[threadID] = threadObj
        } else {
          threadObj = cache[threadID]
        }

        switch (data.type) {
          case 'message':
            Message.create({
              body: data.body,
              timestamp: data.timestamp,
              sender: data.senderID,
              id: data.messageID,
              thread: threadObj._id
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

          case 'message_reply':
            let refMessage = await Message.findOne({ id: data.messageReply.messageID })
            let refID = null;
            if (refMessage) {
              refID = refMessage._id
            }

            Message.create({
              body: data.body,
              timestamp: data.timestamp,
              sender: data.senderID,
              id: data.messageID,
              thread: threadObj._id,
              reply: refID
            })
            return

          case 'event':
            // console.log(data);
            return;

          case 'message_reaction':
            return

          case 'read_receipt':
          case 'read':
          case 'typ':
          case 'presence':
            return

          default:
            console.log('Unexpected event type: ' + data.type)
        }
      })
    })
  } catch (err) {
    console.log(err)
    throw err
  }
}

go()
