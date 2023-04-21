/* eslint-disable max-len */
const tcpPortUsed = require('tcp-port-used');

const validateIPaddress = (ipAddress) => {
  if (ipAddress === 'localhost' || /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
    return true;
  }
  return 'You have entered an invalid IP address!';
};

const listenPort = async (input) => {
  if (!input) {
    return 'Port is required';
  } else {
    try {
      input = parseInt(input);
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
    } catch (error) {
      return 'Port is invalid';
    }
  }
};

const peerHost = (input) => {
  if (!input) {
    return 'Address is required';
  } else {
    return true;
  }
};

const peerPort = (input) => {
  if (!input) {
    return 'Port is required';
  } else {
    if (0 > input > 65535) {
      return 'You have entered an invalid TCP port [>= 0 and < 65536]';
    } else {
      return true;
    }
  }
};

const ngrokToken = async (input) => {
  if (!input) {
    return 'Ngrok auth token is required';
  } else {
    try {
      const ngrok = require('ngrok');
      const url = await ngrok.connect({
        authtoken: input,
        proto: 'tcp',
        addr: 23452,
      });
      await ngrok.disconnect(url);
      return true;
    } catch (error) {
      return 'The ngrok auth token you have entered is invalid!', error.body;
    }
  }
};

module.exports = {listenPort, peerHost, peerPort, validateIPaddress, ngrokToken};
