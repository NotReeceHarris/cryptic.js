/* eslint-disable max-len */
const showLoadingAnimation = (text) => {
  const frames = ['-', '\\', '|', '/']; // Array of frames
  let index = 0;

  // Update the console output in a loop
  const intervalId = setInterval(() => {
    // Clear the console
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    // Print the current frame
    process.stdout.write('\x1b[32m' + frames[index] + '\x1b[0m' + text);

    // Increment the index
    index = (index + 1) % frames.length;
  }, 100); // Change the interval (in milliseconds) to adjust the animation speed

  // Return a function to stop the animation
  return function stopLoadingAnimation() {
    clearInterval(intervalId);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  };
};

module.exports = {showLoadingAnimation};
