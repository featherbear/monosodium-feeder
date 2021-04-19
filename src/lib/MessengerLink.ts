'use strict'

// TODO: Check for auth token from the database
// passthrough

// https://github.com/Schmavery/facebook-chat-api
// https://github.com/ChatPlug/libfb-js

// const FeederClient = require('./FeederClient')

// module.exports = async function spawnClient (credentials) {
//   let client = new FeederClient()

//   await client.login(credentials)

//   client.api.setOptions({
//     logLevel: 'warn',
//     selfListen: true,
//     listenEvents: true,
//     forceLogin: true
//   })

//   client.api.listen((err, evt) => {
//     if (err) return console.error(err)

//     client.emit('data', evt)
//   })

//   return client
// }


let FBClient = require('facebook-messenger-puppeteer')

let EventEmitter = require('events')

class MessengerLink extends EventEmitter {
  constructor (credentials) {
    super()
    this.api = null
    this.username = null
    this.password = null
    this.clientID = null

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
    // TODO:

    return Number(this.api.getCurrentUserID())
  }

  async login (credentials) {
    if (credentials) {
      this.setCredentials(credentials)
    }

    // TODO: Update client settings for puppeteer
    let client = FBClient({
      selfListen: true
      // cookies??
    })

    await client.login(this.username, this.password)

    this.api = client
    // TODO: this.clientID = api.getCurrentUserID()
  }
}

module.exports = MessengerLink
