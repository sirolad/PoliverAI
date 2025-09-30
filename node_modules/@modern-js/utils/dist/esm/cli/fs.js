import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import { fs } from "../compiled";
var findExists = function(files) {
  var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
  try {
    for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return file;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
  return false;
};
var emptyDir = function() {
  var _ref = _async_to_generator(function(dir) {
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          return [
            4,
            fs.pathExists(dir)
          ];
        case 1:
          if (!_state.sent())
            return [
              3,
              3
            ];
          return [
            4,
            fs.emptyDir(dir)
          ];
        case 2:
          _state.sent();
          _state.label = 3;
        case 3:
          return [
            2
          ];
      }
    });
  });
  return function emptyDir2(dir) {
    return _ref.apply(this, arguments);
  };
}();
export {
  emptyDir,
  findExists
};
