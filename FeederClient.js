'use strict'

// https://github.com/Schmavery/facebook-chat-api
// https://github.com/ChatPlug/libfb-js
let login = require('facebook-chat-api')

let EventEmitter = require('events')

class FeederClient extends EventEmitter {
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
    return Number(this.api.getCurrentUserID())
  }

  async login (credentials) {
    if (credentials) {
      this.setCredentials(credentials)
    }

    return new Promise((resolve, reject) => {

      login(
        {
          email: this.username,
          password: this.password
        },
        (err, api) => {
          if (err) reject(err)
          this.api = api
          this.clientID = api.getCurrentUserID()
          resolve(this)
        }
      )
    })
  }
}

module.exports = FeederClient
