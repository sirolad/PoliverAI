var pluginDagSort = function(plugins) {
  var _loop = function() {
    var zep = zeroEndPoints.shift();
    sortedPoint.push(getPluginByAny(zep));
    allLines = allLines.filter(function(l) {
      return l[0] !== getPluginByAny(zep)[key];
    });
    var restPoints = plugins.filter(function(item) {
      return !sortedPoint.find(function(sp) {
        return sp[key] === item[key];
      });
    });
    zeroEndPoints = restPoints.filter(function(item) {
      return !allLines.find(function(l) {
        return l[1] === item[key];
      });
    });
  };
  var key = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "name", preKey = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "pre", postKey = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "post";
  var getPluginByAny = function getPluginByAny2(q) {
    var target = plugins.find(function(item) {
      return typeof q === "string" ? item[key] === q : item[key] === q[key];
    });
    if (!target) {
      throw new Error("plugin ".concat(q, " not existed"));
    }
    return target;
  };
  var allLines = [];
  plugins.forEach(function(item) {
    var _item_preKey, _item_postKey;
    (_item_preKey = item[preKey]) === null || _item_preKey === void 0 ? void 0 : _item_preKey.forEach(function(p) {
      if (plugins.find(function(ap) {
        return ap.name === p;
      })) {
        allLines.push([
          getPluginByAny(p)[key],
          getPluginByAny(item)[key]
        ]);
      }
    });
    (_item_postKey = item[postKey]) === null || _item_postKey === void 0 ? void 0 : _item_postKey.forEach(function(pt) {
      if (plugins.find(function(ap) {
        return ap.name === pt;
      })) {
        allLines.push([
          getPluginByAny(item)[key],
          getPluginByAny(pt)[key]
        ]);
      }
    });
  });
  var zeroEndPoints = plugins.filter(function(item) {
    return !allLines.find(function(l) {
      return l[1] === item[key];
    });
  });
  var sortedPoint = [];
  while (zeroEndPoints.length)
    _loop();
  if (allLines.length) {
    var restInRingPoints = {};
    allLines.forEach(function(l) {
      restInRingPoints[l[0]] = true;
      restInRingPoints[l[1]] = true;
    });
    throw new Error("plugins dependencies has loop: ".concat(Object.keys(restInRingPoints).join(",")));
  }
  return sortedPoint;
};
export {
  pluginDagSort
};
