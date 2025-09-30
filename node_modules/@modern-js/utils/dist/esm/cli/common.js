import { debug } from "../../compiled/debug";
var createDebugger = function(scope) {
  return debug("modern-js:".concat(scope));
};
var clearConsole = function() {
  if (process.stdout.isTTY && !process.env.DEBUG) {
    process.stdout.write("\x1B[H\x1B[2J");
  }
};
var wait = function() {
  var time = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
};
export {
  clearConsole,
  createDebugger,
  wait
};
