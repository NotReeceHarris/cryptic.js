/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

const version = '1.0';

const crypto = require('crypto');
const inquirer = require('inquirer');

const net = require('net');
const socket = new net.Socket();
const server = net.createServer();
const client = [];

const cryptography = require('./src/cryptography');
const validation = require('./utils/validation');
const color = require('./utils/color');
const ui = require('./utils/ui');

server.on('connection', (socket) => {
  if (client.length === 0) {
    client.push(socket);

    socket.on('close', () => {
      client.splice(0, client.length);
    });
  } else {
    console.log('Connection attempt from 3rd party');
  }
});


// Start with async for a linear process
(async () => {
  let waitInterval;
  let stopWaiting;

  // Generate keys
  const keyPair = cryptography.generateKeys();
  process.env.privateKey = keyPair.privateKey;
  process.env.publicKey = keyPair.publicKey;
  process.env.aesKey = keyPair.aesKey;

  // Get listening port
  await inquirer.prompt([
    {
      type: 'number', name: 'port',
      message: 'What port do you want to listen on?',
      validate: validation.listenPort,
    },
  ]).then((answers) => {
    process.env.port = answers.port;
  });

  // Start listening on inputted port
  await new Promise((res) => {
    server.listen(process.env.port, () => {
      res();
    });
  });

  console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Now listing on port ${process.env.port}...${color.Reset}`);

  // Get peer info
  await inquirer.prompt([
    {
      type: 'input',
      name: 'peer_host',
      message: 'What is the IP address of your peer?',
      default: 'localhost',
      validate: validation.peerHost,
    },
    {
      type: 'number',
      name: 'peer_port',
      message: 'What port is your peer listening on?',
      validate: validation.peerPort,
    },
  ]).then((answers) => {
    process.env.peer_host = answers.peer_host;
    process.env.peer_port = answers.peer_port;
  });

  socket.on('error', () => {
    console.log(`${color.FgRed}!${color.Reset}${color.Bright} Couldn't connect to peer, trying again in 5 seconds...${color.Reset}`);
  });

  socket.on('connect', () => {
    console.log('\x1b[32m!\x1b[0m\x1b[1m Connected to peer\x1b[0m');
  });

  await new Promise(async (res) => {
    await socket.connect(process.env.peer_port, process.env.peer_host, () => {
      res();
    });

    waitInterval = setInterval(function() {
      socket.connect(process.env.peer_port, process.env.peer_host, () => {
        res();
      });
    }, 5000);
  });

  clearInterval(waitInterval);
  stopWaiting = ui.showLoadingAnimation(`${color.Reset}${color.Bright} Waiting for peer to connect.${color.Reset}`);

  await new Promise((res) => {
    waitInterval = setInterval(function() {
      if (client.length === 1) {
        res();
      }
    }, 100);
  });

  clearInterval(waitInterval);
  stopWaiting();
  console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Peer connected from ${client[0].remoteAddress}:${client[0].remotePort}${color.Reset}`);

  stopWaiting = ui.showLoadingAnimation(`${color.Reset}${color.Bright} Performing Diffie-Hellman protocol`);

  const dh = crypto.createDiffieHellman(2048); // Specify the desired key size
  const dhParams = dh.generateKeys();

  process.env.dhPublicKey = dh.getPublicKey();
  process.env.dhPrivateKey = dh.getPrivateKey();

  socket.on('data', (data) => {
    console.log(Buffer.from(data, 'base64').toString('utf8'));
    const dataArray = Buffer.from(data, 'base64').toString('utf8').split(`:key-cryptic.js-v-${version}:`);
    process.env.peerDhPublicKey = Buffer.from(dataArray[1], 'base64').toString('utf8');
  });

  client[0].write(Buffer.from(`${new Date().getTime()}:key-cryptic.js-v-${version}:${process.env.dhPublicKey}`, 'utf8').toString('base64'));

  await new Promise((res) => {
    waitInterval = setInterval(function() {
      if (process.env.peerDhPublicKey != undefined) {
        res();
      }
    }, 100);
  });

  clearInterval(waitInterval);
  process.env.dhSharedKey = crypto.createSecretKey(
      crypto.diffieHellmanComputeSecret(process.env.dhPublicKey, process.env.peerDhPublicKey),
  );

  stopWaiting();
  console.log(`${color.FgBlue}#${color.Reset}${color.Bright} Shared key checksum: md5 ${crypto.createHash('md5').update(process.env.dhSharedKey, 'utf8').digest('hex')}`);
})();
