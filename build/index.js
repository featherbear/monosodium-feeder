"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }require('dotenv').config()

const { mongoConnection } = process.env

// if (!mongoConnection) throw new Error('MongoDB connection URI not supplied!')

var _monosodiumcommons = require('monosodium-commons'); var _monosodiumcommons2 = _interopRequireDefault(_monosodiumcommons);
// console.log(a);

let {
  Models: { Message }
} = _monosodiumcommons2.default

console.log(Message);
// import { Models: { Message, Thread } } from 'monosodium-commons'

// async function handleMessage (data) {
//   switch (data.type) {
//     case 'message':
//       Message.create({
//         body: data.body,
//         timestamp: data.timestamp,
//         sender: data.senderID,
//         id: data.messageID,
//         thread: threadObj._id
//       })
//       return
//     case 'message_unsend':
//       Message.findOne({ id: data.messageID }, (err, msg) => {
//         if (err) {
//           console.error(err)
//           return
//         }

//         msg.markAsDeleted()
//       })
//       return

//     case 'message_reply':
//       let refMessage = await Message.findOne({
//         id: data.messageReply.messageID
//       })
//       let refID = null
//       if (refMessage) {
//         refID = refMessage._id
//       }

//       Message.create({
//         body: data.body,
//         timestamp: data.timestamp,
//         sender: data.senderID,
//         id: data.messageID,
//         thread: threadObj._id,
//         reply: refID
//       })
//       return

//     case 'event':
//       // console.log(data);
//       return

//     case 'message_reaction':
//       return

//     case 'read_receipt':
//     case 'read':
//     case 'typ':
//     case 'presence':
//       return

//     default:
//       console.log('Unexpected event type: ' + data.type)
//   }
// }

// async function go () {
//   // TODO: Auth?
//   // TODO: Connect to MongoDB
//   await mongoose.connect(mongoConnection, function (err) {
//     if (err) {
//       throw new Error('Could not connect to MongoDB')
//     }

//     console.log('Connected to MongoDB')
//   })

//   // TODO: Check users
//   // Launch users, get the user session
//   let userData = []

//   for (let user of userData) {
//     // onMessage store into the MongoDB
//     //    check if multipart (text, image, video)
//     //    ?? Download images into FS rather than into MongoDB
//     //

//     let bot = spawnClient(credentials).then(bot => {
//       let cache = {}

//       bot.on('data', async function (data) {
//         let threadID = data.threadID
//         let threadObj

//         if (!(threadID in cache)) {
//           threadObj = await Thread.findOne({ id: threadID })
//           if (!threadObj) {
//             threadObj = await Thread.create({ id: threadID })
//             bot.api.getThreadInfo(threadID, function (err, response) {
//               // response.threadName || response.name
//               // response.participantsIDs
//             })
//           }

//           cache[threadID] = threadObj
//         } else {
//           threadObj = cache[threadID]
//         }

//         handleMessage(data)
//       })
//     })
//   }
// }

// go()
