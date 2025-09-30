import fs from "fs";
import path from "path";
import { glob, yaml } from "../compiled";
const PACKAGE_MAX_DEPTH = 5;
const WORKSPACE_FILES = {
  YARN: "package.json",
  PNPM: "pnpm-workspace.yaml",
  LERNA: "lerna.json"
};
const isLerna = (root) => fs.existsSync(path.join(root, WORKSPACE_FILES.LERNA));
const isYarnWorkspaces = (root) => {
  var _json_workspaces;
  const pkg = path.join(root, WORKSPACE_FILES.YARN);
  if (!fs.existsSync(pkg)) {
    return false;
  }
  const json = JSON.parse(fs.readFileSync(pkg, "utf8"));
  return Boolean((_json_workspaces = json.workspaces) === null || _json_workspaces === void 0 ? void 0 : _json_workspaces.packages);
};
const isPnpmWorkspaces = (root) => fs.existsSync(path.join(root, WORKSPACE_FILES.PNPM));
const isMonorepo = (root) => isLerna(root) || isYarnWorkspaces(root) || isPnpmWorkspaces(root);
const findMonorepoRoot = (appDirectory, maxDepth = PACKAGE_MAX_DEPTH) => {
  let inMonorepo = false;
  let monorepoRoot = appDirectory;
  for (let depth = 0; depth < maxDepth; depth++) {
    if (isMonorepo(appDirectory)) {
      inMonorepo = true;
      break;
    }
    monorepoRoot = path.dirname(appDirectory);
  }
  return inMonorepo ? monorepoRoot : void 0;
};
const getMonorepoPackages = (root) => {
  let packages = [];
  if (isYarnWorkspaces(root)) {
    const json = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    ({ packages } = json.workspaces);
  } else if (isLerna(root)) {
    const json = JSON.parse(fs.readFileSync(path.resolve(root, "lerna.json"), "utf8"));
    ({ packages } = json);
  } else {
    ({ packages } = yaml.load(fs.readFileSync(path.join(root, WORKSPACE_FILES.PNPM), "utf8")));
  }
  if (packages) {
    return packages.map((name) => (
      // The trailing / ensures only dirs are picked up
      glob.sync(path.join(root, `${name}/`), {
        ignore: [
          "**/node_modules/**"
        ]
      })
    )).reduce((acc, val) => acc.concat(val), []).filter((filepath) => fs.existsSync(path.resolve(filepath, "package.json"))).map((filepath) => ({
      path: filepath,
      name: JSON.parse(fs.readFileSync(path.resolve(filepath, "package.json"), "utf8")).name
    }));
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
