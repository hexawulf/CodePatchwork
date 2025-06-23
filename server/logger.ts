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

const fileTransport = new transports.File({ filename: logFile });

fileTransport.on('error', err => {
  console.error('⚠️ File transport error:', err.message);
  try {
    fs.appendFileSync(
      path.join(logDir, 'fallback.log'),
      `[${new Date().toISOString()}] Logger failed: ${err.message}\n`
    );
  } catch (appendErr) {
    console.error('⚠️ Fallback logging failed:', (appendErr as Error).message);
  }
});

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
    fileTransport
  ]
});

logger.on('error', (err) => {
  console.error('❌ Winston internal logging error:', err);
});

logger.info('🧪 Winston logger initialized and ready.');

export default logger;
export const __loggerSideEffect__ = true;
