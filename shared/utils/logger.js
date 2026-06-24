const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });

const format = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

const logger = morgan(format, { stream: accessLogStream });

const logError = (err, req = null) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ERROR: ${err.message}\n${err.stack}`;
  errorLogStream.write(message + '\n');
  if (req) {
    errorLogStream.write(`  Request: ${req.method} ${req.url}\n  IP: ${req.ip}\n`);
  }
  console.error(message);
};

const logInfo = (message) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] INFO: ${message}`;
  accessLogStream.write(line + '\n');
  console.log(line);
};

module.exports = { logger, logError, logInfo };
