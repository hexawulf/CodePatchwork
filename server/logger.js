// logger.js — Drop-in Winston logger with safety checks and startup test log
import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

// Ensure log directory exists
const logDir = '/home/zk/logs';
const logFile = path.join(logDir, 'codepatchwork.log');

if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`✅ Created log directory: ${logDir}`);
  } catch (err) {
    console.error(`❌ Failed to create log directory: ${logDir}`, err);
  }
}

// Define transports
const transportList = [
  new transports.Console(),
];

try {
  transportList.push(
    new transports.File({ filename: logFile })
  );
} catch (err) {
  console.error("❌ Could not create file transport for Winston:", err);
}

// Create the logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}]: ${message}${metaString}`;
    })
  ),
  transports: transportList
});

// Handle internal Winston errors
logger.on('error', (err) => {
  console.error("❌ Winston internal logging error:", err);
});

// 🔧 Initial test log
logger.info("🧪 Winston logger initialized and ready.");

export default logger;
