/* eslint-disable max-len */
const net = require('net');

/* const sharedKey = 'mysharedkey'; // Replace with your shared key

const {privateKey, publicKey} = generateKeys();
const encryptedSharedKey = generateShared(sharedKey, publicKey);
const decryptedSharedKey = decryptShared(encryptedSharedKey, privateKey); */

const socket = new net.Socket();
const server = net.createServer();
let client = [];

server.on('connection', (socket) => {
  if (client.length === 0) {
    client.push(socket);

    /* socket.on('data', (data) => {
      const message = data.toString().trim();
      const decryptedPlaintext = decrypt(JSON.parse(message), decryptedSharedKey);
      console.log(`Received message: ${decryptedPlaintext}`);
    }); */

    socket.on('close', () => {
      client = [];
    });
  } else {
    console.log('Connection attempt from 3rd party');
  }
});

socket.on('error', () => {
  console.log('\x1b[31m!\x1b[0m\x1b[1m Couldn\'t connect to peer, trying again in 5 seconds...\x1b[0m');
});

socket.on('connect', () => {
  console.log('\x1b[32m!\x1b[0m\x1b[1m Connected to peer\x1b[0m');
});

/* socket.on('data', (data) => {
  const message = data.toString().trim();
  console.log(message);
}); */

/* const sendMessage = (message) => {
  if (socket) {
    const encryptedMessage = encrypt(message, decryptedSharedKey);
    socket.write(`${JSON.stringify(encryptedMessage)}\n`);
  } else {
    console.log('Not connected to any peer.');
  }
}; */

module.exports = {server, socket, client};
