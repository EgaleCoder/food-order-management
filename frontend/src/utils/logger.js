/**
 * Frontend logger utility
 * Writes to the browser console with timestamps.
 * In production, only warnings and errors are shown.
 */

const isDev = import.meta.env.DEV;

const timestamp = () => new Date().toISOString();

const logger = {
  debug: (...args) => {
    if (isDev) console.debug(`[${timestamp()}] [DEBUG]`, ...args);
  },
  info: (...args) => {
    if (isDev) console.info(`[${timestamp()}] [INFO]`, ...args);
  },
  warn: (...args) => {
    console.warn(`[${timestamp()}] [WARN]`, ...args);
  },
  error: (...args) => {
    console.error(`[${timestamp()}] [ERROR]`, ...args);
  },
};

export default logger;
