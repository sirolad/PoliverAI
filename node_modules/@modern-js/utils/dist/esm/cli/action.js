import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _to_consumable_array } from "@swc/helpers/_/_to_consumable_array";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import { execa } from "../compiled";
var newAction = function() {
  var _ref = _async_to_generator(function(config, solution) {
    var _process_env_MODERN_JS_VERSION;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          return [
            4,
            execa("npx", [
              "--yes",
              "@modern-js/new-action@".concat((_process_env_MODERN_JS_VERSION = process.env.MODERN_JS_VERSION) !== null && _process_env_MODERN_JS_VERSION !== void 0 ? _process_env_MODERN_JS_VERSION : "latest"),
              "--config=".concat(JSON.stringify(config)),
              "--solution=".concat(solution)
            ], {
              stderr: "inherit",
              stdout: "inherit",
              stdin: "inherit"
            })
          ];
        case 1:
          _state.sent();
          return [
            2
          ];
      }
    });
  });
  return function newAction2(config, solution) {
    return _ref.apply(this, arguments);
  };
}();
var upgradeAction = function() {
  var _ref = _async_to_generator(function() {
    var _process_env_MODERN_JS_VERSION;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          return [
            4,
            execa("npx", [
              "--yes",
              "@modern-js/upgrade@".concat((_process_env_MODERN_JS_VERSION = process.env.MODERN_JS_VERSION) !== null && _process_env_MODERN_JS_VERSION !== void 0 ? _process_env_MODERN_JS_VERSION : "latest")
            ].concat(_to_consumable_array(process.argv.slice(2))), {
              stdin: "inherit",
              stdout: "inherit",
              stderr: "inherit"
            })
          ];
        case 1:
          _state.sent();
          return [
            2
          ];
      }
    });
  });
  return function upgradeAction2() {
    return _ref.apply(this, arguments);
  };
}();
export {
  newAction,
  upgradeAction
};
