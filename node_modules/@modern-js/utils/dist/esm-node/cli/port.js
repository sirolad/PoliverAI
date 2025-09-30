import net from "net";
import { chalk } from "../compiled";
import { logger } from "./logger";
const getPort = async (expectPort, { tryLimits = 20, strictPort = false, slient = false } = {}) => {
  let port = expectPort;
  if (typeof port === "string") {
    port = parseInt(port, 10);
  }
  if (strictPort) {
    tryLimits = 1;
  }
  const original = port;
  let found = false;
  let attempts = 0;
  while (!found && attempts <= tryLimits) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen({
          port,
          host: "0.0.0.0"
        }, () => {
          found = true;
          server.close(resolve);
        });
      });
    } catch (e) {
      if (e.code !== "EADDRINUSE") {
        throw e;
      }
      port++;
      attempts++;
    }
  }
  if (port !== original) {
    if (strictPort) {
      throw new Error(`Port "${original}" is occupied, please choose another one.`);
    } else if (!slient) {
      logger.info(`Port ${original} is in use. ${chalk.yellow(`using port ${port}.`)}`);
    }
  }
  return port;
};
export {
  getPort
};
