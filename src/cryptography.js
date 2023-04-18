/* eslint-disable max-len */
const crypto = require('crypto');

const generateKeys = () => {
  // Generate RSA key pair
  const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Generate AES key
  const aesKey = crypto.randomBytes(32); // 256 bits key size

  // Return the generated keys and AES key
  return {publicKey, privateKey, aesKey};
};

const createSharedKey = (recipientPublicKey, senderPrivateKey) => {
  const sharedKey = crypto.publicEncrypt(recipientPublicKey, senderPrivateKey);
  return sharedKey.toString('base64');
};

const encryptData = (data, aesKey) => {
  const cipher = crypto.createCipher('aes-256-cbc', aesKey);
  const encryptedData = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  return encryptedData.toString('base64');
};

const decryptData = (encryptedData, aesKey) => {
  const decipher = crypto.createDecipher('aes-256-cbc', aesKey);
  const decryptedData = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'base64')), decipher.final()]);
  return decryptedData.toString('utf8');
};

module.exports = {generateKeys, createSharedKey, encryptData, decryptData};
