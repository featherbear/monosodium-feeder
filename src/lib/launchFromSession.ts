import { ACrypt } from 'monosodium-commons'
import MessengerLink from './MessengerLink'
import crypto from 'crypto'

export default async function (sessionData: Buffer, sessionCrypt: Buffer) {
    // Session supposedly active, login

    sessionCrypt = ACrypt.decryptData(sessionCrypt)

    let decipher = crypto.createDecipheriv('aes-256-cbc', sessionCrypt.slice(0, 32), sessionCrypt.slice(32));
    let session = JSON.parse(Buffer.concat([decipher.update(sessionData), decipher.final()]).toString());
    let link = new MessengerLink()

    // TODO: Check session expiration
    await link.login({ session })

    // TODO: Save updated session
    return link
}