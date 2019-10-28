'use strict'

let login = require('facebook-chat-api')
let EventEmitter = require('events')

class FeederClient extends EventEmitter {
  constructor (credentials) {
    super()
    this.api = null
    this.username = null
    this.password = null

    if (credentials) { 
      this.setCredentials(credentials)
    }
  }

  setCredentials ({ username, password }) {
    this.username = username
    this.password = password
    return this
  }

  get id () {
    if (this.api === null) throw Error('Bot not logged in')
    return Number(this.api.getCurrentUserID())
  }

  async login (credentials) {
    if (credentials) {
      this.setCredentials(credentials)
    }

    return new Promise((resolve, reject) => {
      login( {
         username: this.username,
         password: this.password 
        },
        (err, api) => {
          if (err) reject(err)
          this.api = api
          resolve(this)
        }
      )
    })
  }
}



async function spawnClient (credentials) {
  let client = new FeederClient()

  await client.login(credentials)

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
