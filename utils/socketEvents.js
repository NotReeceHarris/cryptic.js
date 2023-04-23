/* eslint-disable max-len */
const color = require('./color');
const crypto = require('crypto');
const cryptography = require('./cryptography');

module.exports = (socket, client, version, algorithm, messageLogs) => {
  // Listen for incoming data from the socket
  socket.on('data', async (data) => {
    // If the peer public key has not been set yet, but it's included in the data,
    // extract the public key from the data and set it as the peer public key
    if (process.env.peerPublicKey === undefined) {
      const dataArray = Buffer.from(cryptography.shuffle(data.toString('utf8').split(''), [5, 3, 7, 3, 9, 2, 3, 3, 6, 7, 8, 0, 5, 2], true).join(''), 'hex').toString('utf8').split(`:`);

      if (Buffer.from(dataArray[0], 'base64').toString('utf8') != version) {
        console.log(`${color.FgRed}!${color.Reset}${color.Bright} Peer is using a diffrent version, your running "${version}" and the peer is running "${Buffer.from(dataArray[0], 'base64').toString('utf8')}"${color.Reset}`);
        process.exit(0);
      }
      process.env.peerPublicKey = dataArray[1];
      return;
    }

    // If the shared key has not been confirmed yet, but a validation message is included in the data,
    // wait for the shared key to be set and confirm that it matches the hashed shared key from the message
    if (process.env.confirmedSharedKey === undefined) {
      let waitIntervalQueue;

      // Create a waiting loop to capture the confirmation packet.
      // We use a loop because the arrival time of the packet is unknown, so we wait for it.
      await new Promise((res) => {
        waitIntervalQueue = setInterval(function() {
          if (process.env.sharedKey != undefined && process.env.confirmedSharedKey === undefined) {
            const dataArray = Buffer.from(cryptography.shuffle(data.toString('utf8').split(''), process.env.shuffleKey.split(','), true).join(''), 'hex').toString('utf8').split(':iv:');
            const hashedSharedKey = crypto.createHash('sha256').update(process.env.sharedKey).digest('hex');

            // Decrypt the encrypted message containing the hashed shared key using the shared key
            const encrypted = Buffer.from(dataArray[0], 'hex');
            const iv = Buffer.from(dataArray[1], 'base64');
            const key = Buffer.from(process.env.sharedKey, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('hex');

            // Confirm that the decrypted message matches the hashed shared key
            process.env.confirmedSharedKey = decrypted === hashedSharedKey;
            res();
          }
        }, 100);
      });

      clearInterval(waitIntervalQueue);
      return;
    }

    // If the shared key has been confirmed and a message is included in the data,
    // decrypt the message using the shared key and log it to the console
    if (process.env.confirmedSharedKey) {
      const ivSplitter = crypto.createHash('sha256').update(process.env.sharedKey).digest('hex').slice(4, 12);
      const dataArray = Buffer.from(cryptography.shuffle(data.toString('utf8'), process.env.shuffleKey.split(','), true).join(''), 'hex').toString('utf8').split(ivSplitter);

      const iv = Buffer.from(dataArray[0], 'base64');
      const key = Buffer.from(process.env.sharedKey, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);

      // Decrypt the message using the shared key and the initialization vector from the message
      const decrypted = cryptography.decrypt(Buffer.from(dataArray[1], 'base64'), decipher);

      // If the decrypted message includes a timestamp, log the message with the timestamp
      if (decrypted.includes(':timestamp:')) {
        const message = decrypted.split(':timestamp:')[1];
        const timestamp = parseInt(decrypted.split(':timestamp:')[0]);

        messageLogs.push({
          timestamp: timestamp,
          message: message,
          from: 'peer',
        });

        console.log(`${color.FgBlue}${color.Bright}[${color.FgWhite}${new Date(timestamp).toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })}${color.FgBlue}${color.Bright}] (Peer)${color.Reset}: ${message}`);
      } else {
        // Log the fact that the message couldn't be decrypted
        messageLogs.push({
          timestamp: new Date().getTime(),
          message: 'Couldn\'t decrypt message',
          from: 'peer',
        });
      }
    }
  });

  // Listen for errors on the socket
  socket.on('error', () => {
    // If no client is connected and the shared key has not been confirmed
    if (client.length === 0 && !process.env.confirmedSharedKey) {
      console.log(`${color.FgRed}!${color.Reset}${color.Bright} Couldn't connect to peer, trying again in 5 seconds...${color.Reset}`);
    }

    // If no client is connected and the shared key has been confirmed
    if (client.length === 0 && process.env.confirmedSharedKey) {
      console.log(`${color.FgRed}!${color.Reset}${color.Bright} The peer has disconnected${color.Reset}`);
      process.exit();
    }
  });
};
