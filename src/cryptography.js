const crypto = require('crypto');

const encrypt = (plaintext, decryptedSharedKey) => {
    const aesKey = crypto.createHash('sha256').update(decryptedSharedKey, 'utf8').digest(); // Use a hash function to derive a valid AES key
    const iv = crypto.randomBytes(16); // Generate a random IV (Initialization Vector)

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const encryptedPlaintext = encryptedBuffer.toString('base64')

    return {
        iv: iv.toString('base64'),
        data: encryptedPlaintext
    };
};

const decrypt = (encryptedData, decryptedSharedKey) => {
    const aesKey = crypto.createHash('sha256').update(decryptedSharedKey, 'utf8').digest(); // Use a hash function to derive a valid AES key
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, Buffer.from(encryptedData.iv, 'base64'));
    const decryptedBuffer = Buffer.concat([decipher.update(Buffer.from(encryptedData.data, 'base64')), decipher.final()]);
    return decryptedBuffer.toString('utf8')
};

const generateKeys = () => {
    return { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
};

const generateShared = (sharedKey, publicKey) => {
    return crypto.publicEncrypt(publicKey, Buffer.from(sharedKey, 'utf8')).toString('base64');
};

const decryptShared = (encryptedSharedKey, privateKey) => {
    return crypto.privateDecrypt(privateKey, Buffer.from(encryptedSharedKey, 'base64')).toString('utf8')
};

module.exports = {encrypt, decrypt, generateKeys, generateShared, decryptShared}