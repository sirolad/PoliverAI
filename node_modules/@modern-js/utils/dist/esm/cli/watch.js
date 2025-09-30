import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import path from "path";
import { chokidar } from "../compiled";
var WatchChangeType = {
  ADD: "add",
  UNLINK: "unlink",
  CHANGE: "change"
};
var watch = function(watchDir, runTask) {
  var ignored = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
  var ready = false;
  var watcher = chokidar.watch(watchDir, {
    ignored
  });
  watcher.on("ready", function() {
    return ready = true;
  });
  watcher.on("change", function() {
    var _ref = _async_to_generator(function(filePath) {
      var changedFilePath;
      return _ts_generator(this, function(_state) {
        switch (_state.label) {
          case 0:
            changedFilePath = path.resolve(filePath);
            return [
              4,
              runTask({
                changedFilePath,
                changeType: WatchChangeType.CHANGE
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
    return function(filePath) {
      return _ref.apply(this, arguments);
    };
  }());
  watcher.on("add", function() {
    var _ref = _async_to_generator(function(filePath) {
      var changedFilePath;
      return _ts_generator(this, function(_state) {
        switch (_state.label) {
          case 0:
            changedFilePath = path.resolve(filePath);
            if (!ready)
              return [
                3,
                2
              ];
            return [
              4,
              runTask({
                changedFilePath,
                changeType: WatchChangeType.ADD
              })
            ];
          case 1:
            _state.sent();
            _state.label = 2;
          case 2:
            return [
              2
            ];
        }
      });
    });
    return function(filePath) {
      return _ref.apply(this, arguments);
    };
  }());
  watcher.on("unlink", function() {
    var _ref = _async_to_generator(function(filePath) {
      var changedFilePath;
      return _ts_generator(this, function(_state) {
        switch (_state.label) {
          case 0:
            changedFilePath = path.resolve(filePath);
            return [
              4,
              runTask({
                changedFilePath,
                changeType: WatchChangeType.UNLINK
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
    return function(filePath) {
      return _ref.apply(this, arguments);
    };
  }());
  watcher.on("error", function(err) {
    throw err;
  });
  return watcher;
};
export {
  WatchChangeType,
  watch
};
