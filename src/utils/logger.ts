import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Print full stack for errors
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),

    // Uncomment to enable file logging
    // new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/combined.log' }),
  ],
});
