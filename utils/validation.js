/* eslint-disable max-len */
const tcpPortUsed = require('tcp-port-used');

// This function validates an IP address by checking if it is a valid IPv4 address or 'localhost'.
const validateIPaddress = (ipAddress) => {
  // Check if the IP address is 'localhost' or matches a valid IPv4 address pattern
  if (ipAddress === 'localhost' || /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
    // Return true if the IP address is valid
    return true;
  }
  // Otherwise, return an error message stating that the IP address is invalid
  return 'You have entered an invalid IP address!';
};

// Define a function to validate the input TCP port number
const listenPort = async (input) => {
  // If input is not provided, return error message
  if (!input) {
    return 'Port is required';
  } else {
    try {
      // Parse the input as an integer
      input = parseInt(input);
      // Check if the input is within valid range of TCP ports
      if (1 > input > 65535) {
        return 'You have entered an invalid TCP port [1 > port > 65535]';
      } else {
        // Check if the port is already in use on localhost
        if (await tcpPortUsed.check(input, '127.0.0.1').then((inUse) => {
          return inUse;
        }, () => {
          return true;
        })) {
          return 'Port is already in use!';
        }
        // If port is valid and not in use, return true
        return true;
      }
    } catch (error) {
      // If input cannot be parsed as integer, return error message
      return 'Port is invalid';
    }
  }
};

// A function to validate peer host address
const peerHost = (input) => {
  if (!input) { // if input is undefined or empty string
    return 'Address is required'; // return an error message
  } else {
    return true; // otherwise, return true to indicate a valid input
  }
};

// Function to validate a peer's TCP port number
const peerPort = (input) => {
  // If input is not provided
  if (!input) {
    return 'Port is required';
  } else {
    // Check if input is within valid range of TCP port numbers
    if (0 > input > 65535) {
      return 'You have entered an invalid TCP port [>= 0 and < 65536]';
    } else {
      // Input is valid
      return true;
    }
  }
};

// This function validates the ngrok auth token input by attempting to connect to ngrok and then disconnecting
const ngrokToken = async (input) => {
  // If the input is empty, return an error message
  if (!input) {
    return 'Ngrok auth token is required';
  } else {
    try {
      // Require ngrok module
      const ngrok = require('ngrok');
      // Connect to ngrok with the provided auth token and TCP protocol on port 23452
      const url = await ngrok.connect({
        authtoken: input,
        proto: 'tcp',
        addr: 23452,
      });
      // Disconnect from ngrok
      await ngrok.disconnect(url);
      // Return true if the auth token is valid
      return true;
    } catch (error) {
      // Return an error message if the auth token is invalid
      return 'The ngrok auth token you have entered is invalid!';
    }
  }
};

module.exports = {listenPort, peerHost, peerPort, validateIPaddress, ngrokToken};
