import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

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

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}]: ${message}${metaString}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFile })
  ]
});

logger.on('error', (err) => {
  console.error('❌ Winston internal logging error:', err);
});

logger.info('🧪 Winston logger initialized and ready.');

export default logger;
