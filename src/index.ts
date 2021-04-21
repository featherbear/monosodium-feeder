require('dotenv').config()

import { Mongo } from 'monosodium-commons'
import crypto from 'crypto'
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
  ACrypt.setPublicKey(ACrypt.derivePublicKeyFromPrivateKey(privateKey))
}


import MessengerLink from './lib/MessengerLink'
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

let singletonMap: { [MSG_id: string]: MessengerLink } = {}

import { Types } from 'mongoose'

async function handleFBAuthConnect(userId: Types.ObjectId, authCrypt: Buffer) {

  const [username, password] = ACrypt.decryptData(authCrypt)
    .toString()
    .split(":")
    .map(d => Buffer.from(d, 'base64').toString())


  console.log('Auth request', username, password)
  // TODO: Check single, else close
  let link = (singletonMap[userId.toHexString()] = new MessengerLink())

  // TODO: Handle bad credentials
  await link.login({ username, password })

  let fbAuthModel = await Mongo.Models.User.findOne({ _id: userId }, 'FB_AUTH')
  if (fbAuthModel.FB_AUTH.uid && fbAuthModel.FB_AUTH.uid != link.currentUserID) {
    link.close()
    fbAuthModel.FB_AUTH.session = false
    fbAuthModel.save()
  } else {
    if (!fbAuthModel.FB_AUTH.uid) fbAuthModel.FB_AUTH.uid = link.currentUserID

    let sessionJSON = JSON.stringify(await link.getCurrentSession())
    let secureEnough = crypto.randomBytes(48)
    let cipher = crypto.createCipheriv('aes-256-cbc', secureEnough.slice(0, 32), secureEnough.slice(32));

    fbAuthModel.FB_AUTH.session = Buffer.concat([cipher.update(sessionJSON), cipher.final()]);
    fbAuthModel.FB_AUTH.sessionCrypt = ACrypt.encryptData(secureEnough)

    fbAuthModel.save()
  }
}

async function go() {
  await Mongo.doConnect()

  let users = await Mongo.Models.User.find()
  for (let userModel of users) {
    console.log('user', userModel._id);

    // Check for any pending auth requests
    if (userModel.FB_AUTH.session?.type == 'auth') {
      handleFBAuthConnect(userModel._id, userModel.FB_AUTH.session.data.buffer)
    }

    else if (userModel.FB_AUTH?.uid && Buffer.isBuffer(userModel.FB_AUTH.session?.buffer)) {
      // Session supposedly active, login
      let sessionCrypt: Buffer = userModel.FB_AUTH.sessionCrypt?.buffer
      if (!sessionCrypt) {
        console.warn("Session crypt was not found")
        continue;
      } else {
        sessionCrypt = ACrypt.decryptData(sessionCrypt)
      }

      let encryptedText = userModel.FB_AUTH.session.buffer;
      let decipher = crypto.createDecipheriv('aes-256-cbc', sessionCrypt.slice(0, 32), sessionCrypt.slice(32));

      let session = JSON.parse(Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString());

      let link = (singletonMap[userModel._id] = new MessengerLink())
      await link.login({session})
      // TODO: Save updated session
    }
  }

  Mongo.Models.User.watch(
    [{
      $match: { operationType: 'update' }
    }]
  ).on('change', async (_data) => {
    const data = _data as ChangeEventUpdate
    let { documentKey, updateDescription } = data
    let { updatedFields } = updateDescription || {}
    console.log(documentKey, data);


    if ((updatedFields?.["FB_AUTH.session"])?.type == 'auth') {
      // Handle connect requests
      handleFBAuthConnect(data.documentKey._id, updatedFields["FB_AUTH.session"].data.buffer)
    }
  })
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
