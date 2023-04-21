/* eslint-disable max-len */
const showLoadingAnimation = (text) => {
  const frames = ['-', '\\', '|', '/'];
  let index = 0;
  const intervalId = setInterval(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    process.stdout.write('\x1b[32m' + frames[index] + '\x1b[0m' + text);

    index = (index + 1) % frames.length;
  }, 100);

  return function stopLoadingAnimation() {
    clearInterval(intervalId);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  };
};

module.exports = {showLoadingAnimation};
