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

const encrypt = (message, cipher) => {
  message = crypto.randomBytes((parseInt(crypto.randomBytes(4).toString('hex'), 16) % 10000 - 5000) + 5000).toString('base64') + ':obfuscation:' + Buffer.from(message, 'utf8').toString('base64');

  const array = message.split();
  const seed = process.env.shuffleKey.split('');

  const shuffled = shuffle(array, seed);
  return Buffer.concat([cipher.update(shuffled.join('')), cipher.final()]);
};

const decrypt = (encrypted, decipher) => {
  decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  const array = decrypted.split();
  const seed = process.env.shuffleKey.split('');

  const unshuffled = unshuffle(array, seed, true)[0];
  return Buffer.from(unshuffled.split(':obfuscation:')[1], 'base64').toString('utf8');
};

module.exports = {encrypt, decrypt};
