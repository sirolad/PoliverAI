import { fs } from "../compiled";
const findExists = (files) => {
  for (const file of files) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return file;
    }
  }
  return false;
};
const emptyDir = async (dir) => {
  if (await fs.pathExists(dir)) {
    await fs.emptyDir(dir);
  }
};
export {
  emptyDir,
  findExists
};
