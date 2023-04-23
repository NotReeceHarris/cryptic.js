/* eslint-disable max-len */
const crypto = require('crypto');

// Shuffles an array using Fisher-Yates shuffle algorithm (https://gist.github.com/iSWORD/13f715370e56703f6c973b6dd706bbbd#file-shuffle-js)
const shuffle = (inArr, seed, unshuffle = false) => {
  // Create a copy of the input array to avoid modifying the original array
  const outArr = Array.from(inArr);

  // Get the length of the input array
  const len = inArr.length;

  // Define a function to swap the elements of the array
  const swap = (a, b) => [outArr[a], outArr[b]] = [outArr[b], outArr[a]];

  // Loop through the array and shuffle its elements
  for (
    let i = unshuffle ? len - 1 : 0; // If unshuffle is true, start from the end of the array, otherwise start from the beginning
    unshuffle && i >= 0 || !unshuffle && i < len;
    i += unshuffle ? -1 : 1 // If unshuffle is true, decrement i, otherwise increment i
  ) {
    // Use the seed to generate an index and swap the element at that index with the current element
    swap(seed[i % seed.length] % len, i);
  }

  // Return the shuffled array
  return outArr;
};

// This function encrypts a message using a cipher and returns the encrypted result
const encrypt = (message, cipher) => {
  // Generate a random number between -5000 and 5000, and use it as the length for the random bytes generated for the message
  const randomLength = (parseInt(crypto.randomBytes(4).toString('hex'), 16) % 10000 - 5000) + 5000;
  // Generate random bytes and convert them to base64 string, then concatenate with the message encoded as base64 string
  message = crypto.randomBytes(randomLength).toString('base64') + ':obfuscation:' + Buffer.from(message, 'utf8').toString('base64');

  // Split the message into an array of characters and get the seed from an environment variable
  const array = message.split('');
  const seed = process.env.shuffleKey.split(',');

  // Shuffle the array using the seed
  const shuffled = shuffle(array, seed);

  // Join the shuffled array and update the cipher with the resulting buffer
  return Buffer.concat([cipher.update(shuffled.join('')), cipher.final()]);
};

// This function takes in two parameters: an encrypted value and a decipher object
const decrypt = (encrypted, decipher) => {
  // Decipher the encrypted value and convert it to a UTF-8 string
  decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  // Split the decrypted string into an array
  const array = decrypted.split('');

  // Get the shuffle key from the environment variables and split it into an array
  const seed = process.env.shuffleKey.split(',');

  // Unshuffle the array using the seed and return the first element of the resulting array
  const unshuffled = shuffle(array, seed, true).join('');

  // Split the unshuffled string at the ":obfuscation:" marker, decode the resulting base64 string, and convert it to a UTF-8 string
  return Buffer.from(unshuffled.split(':obfuscation:')[1], 'base64').toString('utf8');
};

// The decrypt function takes in an encrypted value and a decipher object, and returns the decrypted value.

module.exports = {encrypt, decrypt, shuffle};
