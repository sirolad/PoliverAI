import { debug } from "../../compiled/debug";
const createDebugger = (scope) => debug(`modern-js:${scope}`);
const clearConsole = () => {
  if (process.stdout.isTTY && !process.env.DEBUG) {
    process.stdout.write("\x1B[H\x1B[2J");
  }
};
const wait = (time = 0) => new Promise((resolve) => {
  setTimeout(resolve, time);
});
export {
  clearConsole,
  createDebugger,
  wait
};
