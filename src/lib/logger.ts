import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export default logger;
