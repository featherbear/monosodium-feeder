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

  client.api.listen((err, evt) => {
    if (err) return console.error(err)

    client.emit('data', evt)
  })

  return client
}
