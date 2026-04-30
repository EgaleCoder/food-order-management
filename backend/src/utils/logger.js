const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

// Daily rotating file transport
const fileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, '%DATE%.log'),
  datePattern: 'YYYY-MM-DD_HH-mm',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'debug',
});

const errorFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '10m',
  maxFiles: '30d',
  level: 'error',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console output (colourised in dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `[${timestamp}] ${level}: ${message}${extras}`;
        })
      ),
    }),
    fileTransport,
    errorFileTransport,
  ],
});

module.exports = logger;
