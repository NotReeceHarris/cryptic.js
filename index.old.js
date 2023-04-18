/* eslint-disable max-len */

const inquirer = require('inquirer');
const tcpPortUsed = require('tcp-port-used');
const connect = require('./src/connect');
const crypto = require('crypto');

const {validateIPaddress} = require('./utils/validation');
const {showLoadingAnimation, showLoadingAnimationWaitingForConnection, showLoadingAnimationWaitingForSharedKey} = require('./utils/ui');
const cryptography = require('./src/cryptography');

(async () => {
  const keyPair = cryptography.generateKeys();

  process.env.privateKey = keyPair.privateKey;
  process.env.publicKey = keyPair.publicKey;
  process.env.aesKey = keyPair.aesKey;

  await inquirer.prompt([
    {
      type: 'number',
      name: 'port',
      message: 'What port do you want to listen on?',
      validate: async (input) => {
        if (!input) {
          return 'Port number is required';
        } else {
          if (1 > input > 65535) {
            return 'You have entered an invalid TCP port [1 > port > 65535]';
          } else {
            if (await tcpPortUsed.check(input, '127.0.0.1').then((inUse) => {
              return inUse;
            }, () => {
              return true;
            })) {
              return 'Port is already in use!';
            }
            return true;
          }
        }
      },
    },
  ])
      .then((answers) => {
        process.env.port = answers.port;
      })
      .catch((error) => {
        console.error(error);
      });

  /*  */
  console.log(await new Promise((res) => {
    connect.server.listen(process.env.port, () => {
      res(true);
    });
  }).then((bool) => {
    return bool ? '\x1b[32m!\x1b[0m\x1b[1m Now listing on port ' + process.env.port + '\x1b[0m' : '\x1b[31m!\x1b[0m\x1b[1m Couldn\'t start listing on port ' + process.env.port + '\x1b[0m';
  }));
  /*  */

  await inquirer.prompt([
    {
      type: 'input',
      name: 'peer_host',
      message: 'What is the IP address of your peer?',
      default: 'localhost',
      validate: (input) => {
        if (!input) {
          return 'IP address is required';
        } else {
          return validateIPaddress(input);
        }
      },
    },
    {
      type: 'number',
      name: 'peer_port',
      message: 'What port is your peer listening on?',
      validate: (input) => {
        if (!input) {
          return 'Port number is required';
        } else {
          if (1 > input > 65535) {
            return 'You have entered an invalid TCP port [1 > port > 65535]';
          } else {
            return true;
          }
        }
      },
    },
  ])
      .then((answers) => {
        process.env.peer_host = answers.peer_host;
        process.env.peer_port = answers.peer_port;
      })
      .catch((error) => {
        console.error(error);
      });

  // Start the loading animation
  const stopAnimation = showLoadingAnimation();
  let connectInterval;

  await new Promise(async (res) => {
    await connect.socket.connect(process.env.peer_port, process.env.peer_host, () => {
      stopAnimation();
      res();
    });
    stopAnimation();

    // Set the interval to try connecting every 5 seconds
    connectInterval = setInterval(function() {
      connect.socket.connect(process.env.peer_port, process.env.peer_host, () => {
        res();
      });
    }, 5000);
  });

  // Clear the interval when connection is successful
  clearInterval(connectInterval);

  const stopWaiting = showLoadingAnimationWaitingForConnection();

  await new Promise((res) => {
    connectInterval = setInterval(function() {
      if (connect.client.length === 1) {
        res();
      }
    }, 100);
  });

  stopWaiting();
  console.log(`\x1b[32m!\x1b[0m\x1b[1m Peer connected from ${connect.client[0].remoteAddress}:${connect.client[0].remotePort}\x1b[0m`);
  clearInterval(connectInterval);
  console.log('\x1b[32m!\x1b[0m\x1b[1m Sending public key...\x1b[0m');

  const encodedPublicKey = Buffer.from(process.env.publicKey, 'utf8').toString('base64');
  const encodedAesKey = Buffer.from(process.env.aesKey, 'utf8').toString('base64');

  connect.client[0].write(`${new Date().getTime()}:publickey:${encodedPublicKey}:aeskey:${encodedAesKey}`);

  connect.socket.on('data', (data) => {
    const dataArray = data.toString().split(':publickey:');
    process.env.peerPublicKey = Buffer.from(dataArray[1], 'base64').toString('utf8');
  });

  const waitingPublicKey = showLoadingAnimationWaitingForSharedKey();

  await new Promise((res) => {
    connectInterval = setInterval(function() {
      if (process.env.peerPublicKey != undefined) {
        res();
      }
    }, 100);
  });

  clearInterval(connectInterval);
  waitingPublicKey();
  console.log('\x1b[32m!\x1b[0m\x1b[1m Received public key and created shard key...\x1b[0m');

  process.env.sharedKey = cryptography.generateSharedKey(process.env.privateKey, process.env.publicKey, process.env.peerPublicKey);

  console.log(`\x1b[34m#\x1b[0m\x1b[1m Shared key Checksum: md5 ${crypto.createHash('md5').update(process.env.sharedKey, 'utf8').digest('hex')}\x1b[0m`);

  console.log('\n');
  console.log(process.env.publicKey);
  console.log('\n');
  console.log(process.env.peerPublicKey);
  console.log('\n');
  console.log(process.env.sharedKey);
})();
