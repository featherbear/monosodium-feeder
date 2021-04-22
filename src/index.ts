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


import type { ChangeEvent, ChangeEventUpdate, ChangeEventTypes } from 'mongodb'

let singletonMap: { [MSG_id: string]: MessengerLink } = {}

import { Mongoose, Types } from 'mongoose'

async function handleFBAuthConnect(userId: Types.ObjectId, authCrypt: Buffer): Promise<[Types.ObjectId, MessengerLink]> {

  const [username, password] = ACrypt.decryptData(authCrypt)
    .toString()
    .split(":")
    .map(d => Buffer.from(d, 'base64').toString())


  console.log('Auth request', username, password)
  // TODO: Check single, else close
  let link = (singletonMap[userId.toHexString()] = new MessengerLink())

  try {
    await link.login({ username, password })
  } catch (e) {
    console.log(e);
  }

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

  return [userId, link]
}

import launchFromSession from './lib/launchFromSession'

async function go() {
  await Mongo.doConnect()

  let users = await Mongo.Models.User.find()
  for (let userModel of users) {
    console.log('user', userModel._id);

    // Check for any pending auth requests
    if (userModel.FB_AUTH.session?.type == 'auth') {
      handleFBAuthConnect(userModel._id, userModel.FB_AUTH.session.data.buffer)
    }

    // Login from session
    else if (userModel.FB_AUTH?.uid && Buffer.isBuffer(userModel.FB_AUTH.session?.buffer)) {
      launchFromSession(
        userModel.FB_AUTH.session?.buffer,
        userModel.FB_AUTH.sessionCrypt?.buffer
      ).then(m => {
        singletonMap[userModel._id] = m
        listenToThread(userModel._id, m)
      })
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






  async function getUserThreadId(MSGUserId: Types.ObjectId) {
    let id;
    id = (await Mongo.Models.UserThread.findOne({ user: MSGUserId }, {}))?._id
    if (id) return id
    return (await Mongo.Models.UserThread.create({ user: MSGUserId, threads: [] }))._id
  }

  async function getThreadId(UserThreadId: Types.ObjectId, tid: Number) {
    let id;
    id = (await Mongo.Models.Thread.findOne({ utid: UserThreadId, tid }, {}))?._id
    if (id) return id
    id = (await Mongo.Models.Thread.create({ utid: UserThreadId, tid, members: [], messages: [], name: 'TODO:' }))._id
    await Mongo.Models.UserThread.findByIdAndUpdate(UserThreadId, { $push: { threads: id } })
    return id;
  }

  async function listenToThread(MSGUserId: Types.ObjectId, MSGLink: MessengerLink) {
    //     // onMessage store into the MongoDB
    //     //    check if multipart (text, image, video)
    //     //    ?? Download images into FS rather than into MongoDB
    //     //
    let userThreadId = await getUserThreadId(MSGUserId)


    let threadIdCache = {}

    MSGLink.listen(async function (data) {

      // TODO: Massage data from the API side

      // switch (data.type) {
      //   ...
      //   default: console.log("Unhandled type:", data.type)
      // }
      // FIXME: Currently assume .type is `message`

      data.thread = Number(data.thread)
      let threadId = threadIdCache[data.thread] || (threadIdCache[data.thread] = await getThreadId(userThreadId, data.thread));

      switch (data.type) {
        case 'message':
          let messageId = (await Mongo.Models.Message.create({ body: data.body, sender: data.sender, timestamp: data.timestamp, thread: threadId, mid: data.messageId }))._id;
          Mongo.Models.Thread.findByIdAndUpdate(threadId, {
            '$push': {
              messages: messageId
            }
          })
          break;

        case 'message_unsend':
          Mongo.Models.Message.findOneAndUpdate({ thread: threadId, mid: data.messageId }, { deleted: true })


      }

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


    })
  }
}

go()
