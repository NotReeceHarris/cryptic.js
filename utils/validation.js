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
};

const peerHost = (input) => {
  if (!input) {
    return 'IP address is required';
  } else {
    return validateIPaddress(input);
  }
};

const peerPort = (input) => {
  if (!input) {
    return 'Port number is required';
  } else {
    if (1 > input > 65535) {
      return 'You have entered an invalid TCP port [1 > port > 65535]';
    } else {
      return true;
    }
  }
};

module.exports = {listenPort, peerHost, peerPort, validateIPaddress};
