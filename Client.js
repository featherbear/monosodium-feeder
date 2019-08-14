'use strict'

let login = require('facebook-chat-api')
let EventEmitter = require('events')

async function spawnClient (creds) {
  let client = new class extends EventEmitter {
    constructor () {
      super()
      this.api = null
    }

    get id () {
      if (this.api === null) throw Error('Bot not logged in')
      return Number(this.api.getCurrentUserID())
    }

    async login (credentials) {
      return new Promise((resolve, reject) => {
        login(credentials, (err, api) => {
          if (err) reject(err)
          this.api = api
          resolve(this)
        })
      })
    }
  }()

  await client.login(creds)

  client.api.setOptions({
    logLevel: 'warn',
    selfListen: true,
    listenEvents: true,
    forceLogin: true
  })

  client.api.listen((err, message) => {
    if (err) return console.error(err)
    console.log(message)
    client.emit('event', {
      body: message.body,
      sender: Number(message.senderID),
      thread: Number(message.threadID),
      timestamp: Number(message.timestamp),
      account: client.id
    })
  })

  return client
}

module.exports = spawnClient
