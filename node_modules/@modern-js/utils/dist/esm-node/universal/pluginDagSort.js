const pluginDagSort = (plugins, key = "name", preKey = "pre", postKey = "post") => {
  let allLines = [];
  function getPluginByAny(q) {
    const target = plugins.find((item) => typeof q === "string" ? item[key] === q : item[key] === q[key]);
    if (!target) {
      throw new Error(`plugin ${q} not existed`);
    }
    return target;
  }
  plugins.forEach((item) => {
    var _item_preKey, _item_postKey;
    (_item_preKey = item[preKey]) === null || _item_preKey === void 0 ? void 0 : _item_preKey.forEach((p) => {
      if (plugins.find((ap) => ap.name === p)) {
        allLines.push([
          getPluginByAny(p)[key],
          getPluginByAny(item)[key]
        ]);
      }
    });
    (_item_postKey = item[postKey]) === null || _item_postKey === void 0 ? void 0 : _item_postKey.forEach((pt) => {
      if (plugins.find((ap) => ap.name === pt)) {
        allLines.push([
          getPluginByAny(item)[key],
          getPluginByAny(pt)[key]
        ]);
      }
    });
  });
  let zeroEndPoints = plugins.filter((item) => !allLines.find((l) => l[1] === item[key]));
  const sortedPoint = [];
  while (zeroEndPoints.length) {
    const zep = zeroEndPoints.shift();
    sortedPoint.push(getPluginByAny(zep));
    allLines = allLines.filter((l) => l[0] !== getPluginByAny(zep)[key]);
    const restPoints = plugins.filter((item) => !sortedPoint.find((sp) => sp[key] === item[key]));
    zeroEndPoints = restPoints.filter((item) => !allLines.find((l) => l[1] === item[key]));
  }
  if (allLines.length) {
    const restInRingPoints = {};
    allLines.forEach((l) => {
      restInRingPoints[l[0]] = true;
      restInRingPoints[l[1]] = true;
    });
    throw new Error(`plugins dependencies has loop: ${Object.keys(restInRingPoints).join(",")}`);
  }
  return sortedPoint;
};
export {
  pluginDagSort
};
