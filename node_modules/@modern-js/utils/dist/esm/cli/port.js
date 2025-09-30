import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import net from "net";
import { chalk } from "../compiled";
import { logger } from "./logger";
var getPort = function() {
  var _ref = _async_to_generator(function(expectPort) {
    var _ref2, _ref_tryLimits, tryLimits, _ref_strictPort, strictPort, _ref_slient, slient, port, original, found, attempts, e;
    var _arguments = arguments;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          _ref2 = _arguments.length > 1 && _arguments[1] !== void 0 ? _arguments[1] : {}, _ref_tryLimits = _ref2.tryLimits, tryLimits = _ref_tryLimits === void 0 ? 20 : _ref_tryLimits, _ref_strictPort = _ref2.strictPort, strictPort = _ref_strictPort === void 0 ? false : _ref_strictPort, _ref_slient = _ref2.slient, slient = _ref_slient === void 0 ? false : _ref_slient;
          port = expectPort;
          if (typeof port === "string") {
            port = parseInt(port, 10);
          }
          if (strictPort) {
            tryLimits = 1;
          }
          original = port;
          found = false;
          attempts = 0;
          _state.label = 1;
        case 1:
          if (!(!found && attempts <= tryLimits))
            return [
              3,
              6
            ];
          _state.label = 2;
        case 2:
          _state.trys.push([
            2,
            4,
            ,
            5
          ]);
          return [
            4,
            new Promise(function(resolve, reject) {
              var server = net.createServer();
              server.unref();
              server.on("error", reject);
              server.listen({
                port,
                host: "0.0.0.0"
              }, function() {
                found = true;
                server.close(resolve);
              });
            })
          ];
        case 3:
          _state.sent();
          return [
            3,
            5
          ];
        case 4:
          e = _state.sent();
          if (e.code !== "EADDRINUSE") {
            throw e;
          }
          port++;
          attempts++;
          return [
            3,
            5
          ];
        case 5:
          return [
            3,
            1
          ];
        case 6:
          if (port !== original) {
            if (strictPort) {
              throw new Error('Port "'.concat(original, '" is occupied, please choose another one.'));
            } else if (!slient) {
              logger.info("Port ".concat(original, " is in use. ").concat(chalk.yellow("using port ".concat(port, "."))));
            }
          }
          return [
            2,
            port
          ];
      }
    });
  });
  return function getPort2(expectPort) {
    return _ref.apply(this, arguments);
  };
}();
export {
  getPort
};
