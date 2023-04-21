/* eslint-disable new-cap */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

const version = '1.0.1';
const algorithm = 'aes-256-cbc';
const ellipticCurve = 'secp256k1';

const validation = require('./utils/validation');
const color = require('./utils/color');
const ui = require('./utils/ui');

if (process.argv[2] === '--version') {
  console.log(`\n${color.FgCyan}Cryptic.js${color.FgWhite} version ${version}${color.Reset}`);
  console.log(`${color.Dim}(https://github.com/NotReeceHarris/cryptic.js)${color.Reset}`);
  process.exit(0);
}

const crypto = require('crypto');
const inquirer = require('inquirer');

const net = require('net');
const socket = new net.Socket();
const server = net.createServer();
const client = [];
const messageLogs = [];

const readline = require('readline');

server.on('connection', (socket) => {
  if (client.length === 0) {
    client.push(socket);

    socket.on('close', () => {
      client.splice(0, client.length);
    });
  } else {
    socket.end();

    console.log(`${color.FgCyan}[${color.FgWhite}${new Date().toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })}${color.FgCyan}] ${color.Bright}(Broadcast)${color.Reset}: A 3rd party connection just tried to connect to you. "${socket.remoteAddress}"`);
  }
});

socket.on('data', async (data) => {
  if (process.env.peerPublicKey === undefined && data.toString('utf8').includes(`:key-cryptic.js-v-${version}:`)) {
    const dataArray = data.toString('utf8').split(`:key-cryptic.js-v-${version}:`);
    process.env.peerPublicKey = dataArray[1];
    return;
  }

  if (process.env.confirmedSharedKey === undefined && data.toString('utf8').includes(`:validate-sharedKey-cryptic.js-v-${version}:`)) {
    let waitIntervalQueue;

    // If request comes and we are not ready for it, queue the request till we are ready
    await new Promise((res) => {
      waitIntervalQueue = setInterval(function() {
        if (process.env.sharedKey != undefined && process.env.confirmedSharedKey === undefined) {
          const dataArray = data.toString('utf8').split(`:validate-sharedKey-cryptic.js-v-${version}:`);
          const hashedSharedKey = crypto.createHash('sha256').update(process.env.sharedKey).digest('hex');

          const encrypted = Buffer.from(dataArray[1].split(':iv:')[0], 'hex');
          const iv = Buffer.from(dataArray[1].split(':iv:')[1], 'base64');
          const key = Buffer.from(process.env.sharedKey, 'hex');
          const decipher = crypto.createDecipheriv(algorithm, key, iv);
          const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('hex');

          process.env.confirmedSharedKey = decrypted === hashedSharedKey;
          res();
        }
      }, 100);
    });

    clearInterval(waitIntervalQueue);
    return;
  }

  if (process.env.confirmedSharedKey && data.toString('utf8').includes(`:message-cryptic.js-v-${version}:`)) {
    const dataArray = data.toString('utf8').split(`:message-cryptic.js-v-${version}:`);

    const encrypted = Buffer.from(dataArray[1], 'base64');
    const iv = Buffer.from(dataArray[0], 'base64');
    const key = Buffer.from(process.env.sharedKey, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

    if (decrypted.includes(':timestamp:')) {
      const message = decrypted.split(':timestamp:')[1];
      const timestamp = parseInt(decrypted.split(':timestamp:')[0]);
      messageLogs.push({
        timestamp: timestamp,
        message: message,
        from: 'peer',
      });
      console.log(`${color.FgBlue}[${color.FgWhite}${new Date(timestamp).toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })}${color.FgBlue}] ${color.Bright}(Peer)${color.Reset}: ${message}`);
    } else {
      messageLogs.push({
        timestamp: new Date().getTime(),
        message: 'Couldn\'t decrypt message',
        from: 'peer',
      });
    }
  }
});

socket.on('error', () => {
  if (client.length === 0 && !process.env.confirmedSharedKey) {
    console.log(`${color.FgRed}!${color.Reset}${color.Bright} Couldn't connect to peer, trying again in 5 seconds...${color.Reset}`);
  }

  if (client.length === 0 && process.env.confirmedSharedKey) {
    console.log(`${color.FgRed}!${color.Reset}${color.Bright} The peer has disconnected${color.Reset}`);
    process.exit();
  }
});

console.log('\n');
console.log(`${color.FgCyan}Cryptic.js${color.FgWhite} V${version}${color.Reset}`);
console.log(`${color.Dim}(https://github.com/NotReeceHarris/cryptic.js)${color.Reset}`);
console.log('────────────────────────────────', '\n');

// Start with async for a linear process
(async () => {
  let waitInterval;
  let loadingAnimation;

  // Get listening port
  await inquirer.prompt([
    {
      type: 'number', name: 'port',
      message: 'Which port would you like to set for listening?',
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
      message: 'What is the IP address of the device you wish to connect with?',
      default: 'localhost',
      validate: validation.peerHost,
    },
    {
      type: 'number',
      name: 'peer_port',
      message: 'Which port is the device you wish to connect with listening on?',
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

  client[0].write(`${new Date().getTime()}:key-cryptic.js-v-${version}:${process.env.publicKey}`);

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

    process.env.derivedSharedKey = derivedSharedKey;
    process.env.sharedKey = sharedKey;
  })();

  clearInterval(waitInterval);
  loadingAnimation();

  console.log(`${color.FgGreen}!${color.Reset}${color.Bright} Elliptic Curve Diffie-Hellman exchange complete${color.Reset}`);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.sharedKey, 'hex'), iv);

  const encrypted = Buffer.concat([cipher.update(crypto.createHash('sha256').update(process.env.sharedKey).digest()), cipher.final()]);

  client[0].write(`${new Date().getTime()}:validate-sharedKey-cryptic.js-v-${version}:${encrypted.toString('hex')}:iv:${iv.toString('base64')}`);

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

  console.log('\n', '────────────────────────────────', '\n');
  console.log(` ${color.FgCyan}Peer${color.Reset}: ${client[0].remoteAddress}`);
  console.log(` ${color.FgCyan}Shared key checksum${color.Reset}: sha256 ${crypto.createHash('sha256').update(process.env.sharedKey).digest('hex')}`);
  console.log(` ${color.FgCyan}Encryption algorithm${color.Reset}: ${algorithm}`);
  console.log(` ${color.FgCyan}Elliptic curve${color.Reset}: ${ellipticCurve}`);
  console.log('\n', '────────────────────────────────', '\n');

  console.log(`${color.FgCyan}[${color.FgWhite}${new Date().toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })}${color.FgCyan}] ${color.Bright}(Broadcast)${color.Reset}: An "end to end" encrypted connection has been established, you may now type.`);

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
      console.log(`${color.FgCyan}[${color.FgWhite}${new Date(timestamp).toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })}${color.FgCyan}] ${color.Bright}(You)${color.Reset}: ${input}`);

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.sharedKey, 'hex'), iv);

      const encrypted = Buffer.concat([cipher.update(`${timestamp}:timestamp:${input}`), cipher.final()]);
      client[0].write(`${iv.toString('base64')}:message-cryptic.js-v-${version}:${encrypted.toString('base64')}`);
    })();
  });
})();
