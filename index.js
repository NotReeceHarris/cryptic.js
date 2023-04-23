#!/usr/bin/env node

/* eslint-disable new-cap */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

const version = '1.3.0';

const color = require('./utils/color');

if (process.argv[2] === '--version') {
  console.log(`\n${color.FgCyan}Cryptic.js${color.FgWhite} version ${version}${color.Reset}\n${color.Dim}https://github.com/NotReeceHarris/cryptic.js${color.Reset}`);
  process.exit(0);
}

const algorithm = 'aes-256-cbc';
const ellipticCurve = 'secp256k1';

const cryptography = require('./utils/cryptography');
const validation = require('./utils/validation');
const ui = require('./utils/ui');

const socketEvents = require('./utils/socketEvents');
const serverEvents = require('./utils/serverEvents');

const crypto = require('crypto');
const inquirer = require('inquirer');
const readline = require('readline');
const net = require('net');

const socket = new net.Socket();
const server = net.createServer();
const client = [];

const messageLogs = [];

serverEvents(server, client);
socketEvents(socket, client, version, algorithm, messageLogs);

console.log(`\n${color.FgCyan}Cryptic.js${color.FgWhite} V${version}${color.Reset}\n${color.Dim}https://github.com/NotReeceHarris/cryptic.js${color.Reset}\n\n────────────────────────────────\n`);

(async () => {
  let waitInterval;
  let loadingAnimation;

  const ngrok = require('ngrok');

  // This code block checks if the command line argument is '--ngrok'.
  if (process.argv[2] === '--ngrok') {
    // If the argument is '--ngrok', it prompts the user to enter their ngrok auth token.
    await inquirer.prompt([
      {
        type: 'input',
        name: 'ngrok_token',
        message: 'What is your ngrok auth token?',
        validate: validation.ngrokToken, // This validates the user's input.
      },
    ]).then((answers) => {
      // After the user enters their token, this line sets the ngrok_token environment variable to the entered token.
      process.env.ngrok_token = answers.port;
    });
  }

  await inquirer.prompt([
    {
      type: 'input', name: 'port',
      message: 'Which port would you like to set for listening?',
      validate: validation.listenPort,
    },
  ]).then((answers) => {
    process.env.port = answers.port;
    server.listen(answers.port, () => {});
  });

  if (process.argv[2] === '--ngrok') {
    try {
      process.env.ngrok_url = await ngrok.connect({authtoken: process.env.ngrok_token, proto: 'tcp', addr: process.env.port});
    } catch (error) {
      console.log(error.body);
      process.exit();
    }
    console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Now listing on port ${process.env.port} and running a secure tunnel to "${process.env.ngrok_url.replace('tcp://', '')}"...${color.Reset}`);
  } else {
    console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Now listing on port ${process.env.port}...${color.Reset}`);
  }

  await inquirer.prompt([
    {
      type: 'input',
      name: 'peer_host',
      message: 'What is the address of the device you wish to connect with?',
      default: 'localhost',
      validate: validation.peerHost,
    },
    {
      type: 'input',
      name: 'peer_port',
      message: 'What is the port of the device you wish to connect with?',
      validate: validation.peerPort,
    },
  ]).then((answers) => {
    process.env.peer_host = answers.peer_host;
    process.env.peer_port = answers.peer_port;
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  socket.on('connect', () => {
    console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Connected to peer${color.Reset}`);
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
  loadingAnimation = ui.showLoadingAnimation(`${color.Reset}${color.Bright} Waiting for peer to connect.${color.Reset}`);

  await new Promise((res) => {
    waitInterval = setInterval(function() {
      if (client.length === 1) {
        res();
      }
    }, 100);
  });

  clearInterval(waitInterval);
  loadingAnimation();

  console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Peer connected from ${client[0].remoteAddress}:${client[0].remotePort}${color.Reset}`);
  loadingAnimation = ui.showLoadingAnimation(`${color.Reset}${color.Bright} Performing Elliptic Curve Diffie-Hellman protocol${color.Reset}`);

  const ecdh = crypto.createECDH(ellipticCurve);
  const privateKey = ecdh.generateKeys();
  const publicKey = ecdh.getPublicKey();

  process.env.privateKey = privateKey;
  process.env.publicKey = publicKey.toString('hex');

  client[0].write(cryptography.shuffle(Buffer.from(`${Buffer.from(version).toString('base64')}:${process.env.publicKey}`).toString('hex').split(''), [5, 3, 7, 3, 9, 2, 3, 3, 6, 7, 8, 0, 5, 2]).join(''));

  await new Promise((res) => {
    waitInterval = setInterval(function() {
      if ('peerPublicKey' in process.env && process.env.peerPublicKey != undefined) {
        res();
      }
    }, 100);
  });

  await (async () => {
    const sharedSecret = await ecdh.computeSecret(Buffer.from(process.env.peerPublicKey, 'hex'));
    const derivedSharedKey = await crypto.createHash('sha256').update(sharedSecret).digest('hex');
    const sharedKey = await crypto.pbkdf2Sync(derivedSharedKey, version, 100000, 32, 'sha256').toString('hex');

    process.env.shuffleKey = [
      ...sharedSecret.toString('hex').replace(/[^0-9]/g, '').split(''),
      ...derivedSharedKey.replace(/[^0-9]/g, '').split(''),
      ...sharedKey.replace(/[^0-9]/g, '').split(''),
    ].join(',');

    process.env.derivedSharedKey = derivedSharedKey;
    process.env.sharedKey = sharedKey;
  })();

  clearInterval(waitInterval);
  loadingAnimation();

  console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Elliptic Curve Diffie-Hellman exchange complete${color.Reset}`);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.sharedKey, 'hex'), iv);

  const encrypted = Buffer.concat([cipher.update(crypto.createHash('sha256').update(process.env.sharedKey).digest()), cipher.final()]);

  client[0].write(cryptography.shuffle(Buffer.from(`${encrypted.toString('hex')}:iv:${iv.toString('base64')}`).toString('hex').split(''), process.env.shuffleKey.split(',')).join(''));

  await new Promise((res) => {
    waitInterval = setInterval(function() {
      if ('confirmedSharedKey' in process.env && process.env.confirmedSharedKey != undefined) {
        res();
      }
    }, 100);
  });

  loadingAnimation();

  if (!process.env.confirmedSharedKey) {
    console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Shared keys do not match, please try again. perhaps the peer is using a different version${color.Reset}`);
    process.exit();
  }

  console.log('\n────────────────────────────────', '\n');
  console.log(`${color.FgCyan}Peer${color.Reset}: ${process.env.peer_host.replace('tcp://', '')}:${process.env.peer_port}`);
  console.log(`${color.FgCyan}Shared key checksum${color.Reset}: sha256 ${crypto.createHash('sha256').update(process.env.sharedKey).digest('hex')}`);
  console.log(`${color.FgCyan}Encryption algorithm${color.Reset}: ${algorithm}`);
  console.log(`${color.FgCyan}Elliptic curve${color.Reset}: ${ellipticCurve}`);
  console.log('\n────────────────────────────────', '\n');

  console.log(`${color.FgCyan}${color.Bright}[${color.FgWhite}${new Date().toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })}${color.FgCyan}${color.Bright}] (Broadcast)${color.Reset}: An "end to end" encrypted connection has been established, you may now type.`);

  rl.on('line', async (input) => {
    if (input === ':q') {
      process.exit();
    }

    if (input === '') {
      readline.moveCursor(process.stdout, 0, -1);
      readline.clearLine(process.stdout, 1);
      return;
    }

    const timestamp = new Date().getTime();

    await (async () => {
      readline.moveCursor(process.stdout, 0, -1);
      readline.clearLine(process.stdout, 1);
      console.log(`${color.FgCyan}${color.Bright}[${color.FgWhite}${new Date(timestamp).toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })}${color.FgCyan}${color.Bright}] (You)${color.Reset}: ${input}`);

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.sharedKey, 'hex'), iv);
      const encrypted = cryptography.encrypt(`${timestamp}:timestamp:${input}`, cipher);

      const ivSplitter = crypto.createHash('sha256').update(process.env.sharedKey).digest('hex').slice(4, 12);
      const joinedString = Buffer.from(`${iv.toString('base64')}${ivSplitter}${encrypted.toString('base64')}`).toString('hex');

      client[0].write(cryptography.shuffle(joinedString.split(''), process.env.shuffleKey.split(',')).join(''));
    })();
  });
})();
