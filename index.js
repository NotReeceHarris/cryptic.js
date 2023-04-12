const {encrypt, decrypt, generateKeys, generateShared, decryptShared} = require('./src/cryptography');

const plaintext = 'Hello, world!'; // Replace with your plaintext
const sharedKey = 'mysharedkey'; // Replace with your shared key

const { privateKey, publicKey } = generateKeys()

const encryptedSharedKey = generateShared(sharedKey, publicKey);
const decryptedSharedKey = decryptShared(encryptedSharedKey, privateKey);

const encryptedPlaintext = encrypt(plaintext, decryptedSharedKey)
const decryptedPlaintext = decrypt(encryptedPlaintext, decryptedSharedKey)

console.log(encryptedPlaintext)
console.log(decryptedPlaintext)