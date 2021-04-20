require('dotenv').config()

import { Mongo } from 'monosodium-commons'

import {
  ACrypt
} from 'monosodium-commons'
let { PRIVATE_KEY } = process.env
if (!PRIVATE_KEY) {
  console.warn('PRIVATE_KEY not set, generating random key')
  const { publicKey, privateKey } = ACrypt.generateKeyPair()
  ACrypt.setPrivateKey(privateKey)
  console.info('Set PRIVATE_KEY to:', ACrypt.serialisePrivateKey(privateKey))
  console.info('Set PUBLIC_KEY to:', ACrypt.serialisePublicKey(publicKey))
} else {
  let privateKey = ACrypt.deserialisePrivateKey(PRIVATE_KEY)
  ACrypt.setPrivateKey(privateKey)
  if (false) {
    console.debug(ACrypt.serialisePublicKey(ACrypt.derivePublicKeyFromPrivateKey(privateKey)))
  }
}

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

import type { ChangeEvent, ChangeEventUpdate, ChangeEventTypes } from 'mongodb'
async function go() {
  await Mongo.doConnect()
  Mongo.Models.User.watch(
    [{
      $match: { operationType: 'update' }
    }]
  ).on('change', (_data) => {
    const data = _data as ChangeEventUpdate
    let { documentKey, updateDescription: { updatedFields } } = data
    console.log(documentKey, updatedFields);

    if ((updatedFields?.["FB_AUTH.session"])?.buffer[0] == 0x3A /* ':' */) {
      // Handle connect requests
      const [username, password] = ACrypt.decryptData(updatedFields["FB_AUTH.session"].buffer.slice(1))
        .toString()
        .split(":")
        .map(d => Buffer.from(d, 'base64').toString())
      console.log('Auth request', username, password)
      // TODO: Spawn ID check client, clear session / set session
    }
  })
  //   // TODO: Check users
  //   // Launch users, get the user session
  // let userData = []
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
}

go()
