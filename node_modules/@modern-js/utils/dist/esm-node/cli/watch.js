import path from "path";
import { chokidar } from "../compiled";
const WatchChangeType = {
  ADD: "add",
  UNLINK: "unlink",
  CHANGE: "change"
};
const watch = (watchDir, runTask, ignored = []) => {
  let ready = false;
  const watcher = chokidar.watch(watchDir, {
    ignored
  });
  watcher.on("ready", () => ready = true);
  watcher.on("change", async (filePath) => {
    const changedFilePath = path.resolve(filePath);
    await runTask({
      changedFilePath,
      changeType: WatchChangeType.CHANGE
    });
  });
  watcher.on("add", async (filePath) => {
    const changedFilePath = path.resolve(filePath);
    if (ready) {
      await runTask({
        changedFilePath,
        changeType: WatchChangeType.ADD
      });
    }
  });
  watcher.on("unlink", async (filePath) => {
    const changedFilePath = path.resolve(filePath);
    await runTask({
      changedFilePath,
      changeType: WatchChangeType.UNLINK
    });
  });
  watcher.on("error", (err) => {
    throw err;
  });
  return watcher;
};
export {
  WatchChangeType,
  watch
};
