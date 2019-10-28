const FeederClient = require('./FeederClient')

module.exports = async function spawnClient (credentials) {
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
