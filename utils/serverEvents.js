/* eslint-disable max-len */
const color = require('./color');

module.exports = (server, client) => {
  // Listen for incoming connections
  server.on('connection', (socket) => {
    // If there are no other clients connected, add this socket to the client list
    if (client.length === 0) {
      client.push(socket);

      // If this socket closes, remove it from the client list
      socket.on('close', () => {
        client.splice(0, client.length);
      });

      // If there are already clients connected, reject this socket and log the attempt
    } else {
      socket.end();

      // Get the current date and time as a formatted string
      const timestamp = new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });

      // Log a message to indicate that a third-party connection attempt was rejected
      console.log(`${color.FgCyan}[${color.FgWhite}${timestamp}${color.FgCyan}] ${color.Bright}(Broadcast)${color.Reset}: A third-party connection just tried to connect to you. "${socket.remoteAddress}"`);
    }
  });
};
