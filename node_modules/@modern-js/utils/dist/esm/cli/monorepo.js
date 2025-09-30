import fs from "fs";
import path from "path";
import { glob, yaml } from "../compiled";
var PACKAGE_MAX_DEPTH = 5;
var WORKSPACE_FILES = {
  YARN: "package.json",
  PNPM: "pnpm-workspace.yaml",
  LERNA: "lerna.json"
};
var isLerna = function(root) {
  return fs.existsSync(path.join(root, WORKSPACE_FILES.LERNA));
};
var isYarnWorkspaces = function(root) {
  var _json_workspaces;
  var pkg = path.join(root, WORKSPACE_FILES.YARN);
  if (!fs.existsSync(pkg)) {
    return false;
  }
  var json = JSON.parse(fs.readFileSync(pkg, "utf8"));
  return Boolean((_json_workspaces = json.workspaces) === null || _json_workspaces === void 0 ? void 0 : _json_workspaces.packages);
};
var isPnpmWorkspaces = function(root) {
  return fs.existsSync(path.join(root, WORKSPACE_FILES.PNPM));
};
var isMonorepo = function(root) {
  return isLerna(root) || isYarnWorkspaces(root) || isPnpmWorkspaces(root);
};
var findMonorepoRoot = function(appDirectory) {
  var maxDepth = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : PACKAGE_MAX_DEPTH;
  var inMonorepo = false;
  var monorepoRoot = appDirectory;
  for (var depth = 0; depth < maxDepth; depth++) {
    if (isMonorepo(appDirectory)) {
      inMonorepo = true;
      break;
    }
    monorepoRoot = path.dirname(appDirectory);
  }
  return inMonorepo ? monorepoRoot : void 0;
};
var getMonorepoPackages = function(root) {
  var packages = [];
  if (isYarnWorkspaces(root)) {
    var json = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    packages = json.workspaces.packages;
  } else if (isLerna(root)) {
    var json1 = JSON.parse(fs.readFileSync(path.resolve(root, "lerna.json"), "utf8"));
    packages = json1.packages;
  } else {
    packages = yaml.load(fs.readFileSync(path.join(root, WORKSPACE_FILES.PNPM), "utf8")).packages;
  }
  if (packages) {
    return packages.map(function(name) {
      return (
        // The trailing / ensures only dirs are picked up
        glob.sync(path.join(root, "".concat(name, "/")), {
          ignore: [
            "**/node_modules/**"
          ]
        })
      );
    }).reduce(function(acc, val) {
      return acc.concat(val);
    }, []).filter(function(filepath) {
      return fs.existsSync(path.resolve(filepath, "package.json"));
    }).map(function(filepath) {
      return {
        path: filepath,
        name: JSON.parse(fs.readFileSync(path.resolve(filepath, "package.json"), "utf8")).name
      };
    });
  }
  return [];
};
export {
  findMonorepoRoot,
  getMonorepoPackages,
  isLerna,
  isMonorepo,
  isPnpmWorkspaces,
  isYarnWorkspaces
};
