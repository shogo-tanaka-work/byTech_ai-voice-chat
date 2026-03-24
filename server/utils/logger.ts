type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
  if (entry.data) {
    return `${base} ${JSON.stringify(entry.data)}`;
  }
  return base;
}

function createEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info(message: string, data?: Record<string, unknown>): void {
    const entry = createEntry("info", message, data);
    process.stdout.write(formatEntry(entry) + "\n");
  },

  warn(message: string, data?: Record<string, unknown>): void {
    const entry = createEntry("warn", message, data);
    process.stdout.write(formatEntry(entry) + "\n");
  },

  error(message: string, data?: Record<string, unknown>): void {
    const entry = createEntry("error", message, data);
    process.stderr.write(formatEntry(entry) + "\n");
  },

  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      const entry = createEntry("debug", message, data);
      process.stdout.write(formatEntry(entry) + "\n");
    }
  },
};
