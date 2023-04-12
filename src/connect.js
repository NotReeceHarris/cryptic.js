const net = require('net');
const readline = require('readline');

const {encrypt, decrypt, generateKeys, generateShared, decryptShared} = require('./cryptography');

const sharedKey = 'mysharedkey'; // Replace with your shared key

const { privateKey, publicKey } = generateKeys()
const encryptedSharedKey = generateShared(sharedKey, publicKey);
const decryptedSharedKey = decryptShared(encryptedSharedKey, privateKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let socket = null;

const sendMessage = (message) => {
    if (socket) {
        const encryptedMessage =  encrypt(message, decryptedSharedKey)
        socket.write(`${JSON.stringify(encryptedMessage)}\n`);
    } else {
        console.log('Not connected to any peer.');
    }
};

const connectToPeer = (host, port) => {
    socket = net.createConnection({ host, port }, () => {
        console.log(`Connected to peer: ${host}:${port}`);
    });

    socket.on('data', (data) => {
        const message = data.toString().trim();
        console.log(message);
    });

    socket.on('close', () => {
        console.log('Disconnected from peer.');
        socket = null;
    });
};

const startChatServer = (port) => {

    const server = net.createServer();
    let client;

    server.on('connection', (socket) => {

        if (client === undefined) {
            console.log(`Peer connected: ${socket.remoteAddress}:${socket.remotePort}`);
            client = socket;

            socket.on('data', (data) => {
                const message = data.toString().trim();
                const decryptedPlaintext = decrypt(JSON.parse(message), decryptedSharedKey)
                console.log(`Received message: ${decryptedPlaintext}`);
            });

            socket.on('close', () => {
                console.log(`Peer disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
                client = undefined;
            });
        } else {
            console.log('Connection attempt from 3rd party')
        }

    });

    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
};

rl.on('line', (input) => {
    const command = input.trim().split(' ');
    const action = command[0];
    const args = command.slice(1);

    if (action === 'send') {
        const message = args.join(' ');
        sendMessage(message);
    } else if (action === 'connect') {
        const host = args[0];
        const port = args[1];
        connectToPeer(host, port);
    } else if (action === 'listen') {
        const port = args[0];
        startChatServer(port);
    } else {
        console.log('Invalid command. Usage: send <message> | connect <host> <port> | listen <port>');
    }
});

rl.on('close', () => {
    console.log('Chat app closed.');
    process.exit(0);
});

