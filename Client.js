'use strict';

let login = require('facebook-chat-api')


async function spawnClient(creds) {
  let client = new class {    
    constructor() {
      this.api = null;
    }
    
    get id() {
      if (this.api === null) throw "Bot not logged in"
      return this.api.getCurrentUserID();
    }
    
    async login(credentials) {
      return new Promise((resolve, reject) => {
        login(credentials, (err, api) => {
          if (err) reject(err);
          this.api = api;        
          resolve(this);
        })  
      });
    }
  }();

  await client.login(creds);
  
  client.api.setOptions({
    logLevel: "warn"
    ,selfListen: true
    ,listenEvents: true
    // ,forceLogin: true
  })
  
  client.api.listen((err, message) => {
    if (err) return console.error(err);
    
    console.log(message);
  })
  
  return client;
}

 
module.exports = spawnClient