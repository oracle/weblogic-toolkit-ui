const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const packageJson = require('../../package.json');
const {getLoggingConfiguration} = require('./userSettings');
const fsUtils = require('./fsUtils');

let _logger;
let _startupLogger;
let _logFileName;
let _wktMode;
// eslint-disable-next-line no-unused-vars
let _wktApp;
let _tempDir;

/* global process */
class BufferedLoggerForStartup {
  constructor() {
    this.bufferEntries = [];
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  notice(message, ...args) {
    this.log('notice', message, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  log(level, message, ...args) {
    this.bufferEntries.push({
      level: level,
      message: message,
      args: args
    });
  }

  dumpLog(winstonLogger) {
    let count = 0;
    for (const bufferedEntry of this.bufferEntries) {
      winstonLogger.log(bufferedEntry.level, bufferedEntry.message, ...bufferedEntry.args);
      count++;
    }
    return count;
  }
}

async function initializeLoggingSystem(wktMode, wktApp, tempDir) {
  if (_logger) {
    return new Promise(resolve => resolve(_logger));
  } else if (_startupLogger) {
    return Promise.resolve(_startupLogger);
  }

  _wktMode = wktMode;
  _wktApp = wktApp;
  _tempDir = tempDir;
  _startupLogger = new BufferedLoggerForStartup();
  const devMode = _wktMode.isDevelopmentMode();

  return new Promise((resolve, reject) => {
    getLoggingConfiguration().then(logConfig => {
      const transports = getTransports(logConfig, devMode);
      _getBaseLogger(devMode, logConfig, transports).then(baseLogger => {
        // Create initial log messages with useful info about the application.
        //
        writeInitialLogEntries(baseLogger, wktApp, transports);
        _logger = baseLogger;
        _startupLogger = null;
        resolve(_logger);
      }).catch(err => reject(err));
    }).catch(err => reject(err));
  });
}

function getLogger() {
  let result = _logger;
  if (!_logger) {
    if (!_startupLogger) {
      throw new Error('getLogger() cannot be called until initializeLoggingSystem() has been called');
    }
    result = _startupLogger;
  }
  return result;
}

function logRendererMessage(windowId, level, message, ...args) {
  const prefix = '[renderer:%s]';
  switch(level) {
    case 'error':
      getLogger().error(`${prefix} ${message}`, windowId, ...args);
      break;

    case 'warn':
      getLogger().warn(`${prefix} ${message}`, windowId, ...args);
      break;

    case 'info':
      getLogger().info(`${prefix} ${message}`, windowId, ...args);
      break;

    case 'debug':
      getLogger().debug(`${prefix} ${message}`, windowId, ...args);
      break;

    default:
      getLogger().log(level, `${prefix} ${message}`, windowId, ...args);
  }
}

function getDefaultLogDirectory(wktMode) {
  if (wktMode && wktMode.isExecutableMode()) {
    return _getDefaultLogDir();
  }
  return process.cwd();
}

function getLogFileName() {
  return _logFileName;
}

async function _getBaseLogger(devMode, logConfig, transports) {
  return new Promise((resolve) => {
    const logLevel = getLogLevel(logConfig);
    if (!transports) {
      transports = getTransports(logConfig, devMode);
    }

    const baseLogger = winston.createLogger({
      level: logLevel,
      exitOnError: false,
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.simple()
      ),
      levels: winston.config.syslog.levels,
      transports: transports,
      exceptionHandlers: transports,
      rejectionHandlers: transports
    });
    resolve(baseLogger);
  });
}

function writeInitialLogEntries(baseLogger, wktApp, transports) {
  if (_logFileName) {
    baseLogger.notice(`Writing ${wktApp.getApplicationName()} log file to ${_logFileName}`);
  }
  baseLogger.notice(`${wktApp.getApplicationName()} version ${wktApp.getApplicationVersion()} (${wktApp.getApplicationBuildVersion()})`);
  baseLogger.notice(`command-line arguments: ${process.argv.join()}`);
  baseLogger.notice('environment:');
  for (const key of Object.keys(process.env)) {
    baseLogger.notice('%s = %s', key, process.env[key]);
  }
  baseLogger.notice(`${packageJson.productName} logging system initialized with logging level ${_getLevelMessage(baseLogger.level)}`);
  for (let transport of transports) {
    baseLogger.notice(`${transport.name} transport initialized with logging level ${_getLevelMessage(transport.level)}`);
  }

  baseLogger.debug('Logging system initialization complete...starting process to switch loggers');
  const numberOfMessages = _startupLogger.dumpLog(baseLogger);
  baseLogger.debug('Logger switch complete after writing %s messages', numberOfMessages);
}

function getLogLevel(logConfig) {
  let logLevel;
  if (logConfig && 'level' in logConfig) {
    logLevel = logConfig['level'];
  }
  return logLevel;
}

function getTransports(logConfig, devMode) {
  const transports = [];

  if (devMode) {
    transports.push(getFileTransport(logConfig['file']));
    transports.push(getConsoleTransport(logConfig['console']));
  } else {
    transports.push(getRotatingFileTransport(logConfig['file']));
  }
  return transports;
}

function getFileTransport(fileLogConfig) {
  const logFileName = _getLogFileName(fileLogConfig);
  const fileTransport = new winston.transports.File({
    filename: logFileName,
    // truncate the existing file in development mode...
    options: {flags: 'w'}
  });

  const logLevel = getLogLevel(fileLogConfig);
  if (logLevel) {
    fileTransport['level'] = logLevel;
  }

  const dirName = _getLogFileDir(fileLogConfig);
  if (dirName) {
    fileTransport['dirname'] = dirName;
    _logFileName = path.join(dirName, logFileName);
  } else {
    _logFileName = path.join(process.cwd(), logFileName);
  }

  return fileTransport;
}

function getRotatingFileTransport(fileLogConfig) {
  const fileTransport = new winston.transports.DailyRotateFile({
    filename: _getRotatingLogFileName(fileLogConfig),
    dirname: _getRotatingLogFileDir(fileLogConfig),
    datePattern: _getLogFileDatePattern(fileLogConfig)
  });

  const logLevel = getLogLevel(fileLogConfig);
  if (logLevel) {
    fileTransport['level'] = logLevel;
  }

  if (_getLogFileZippedArchive(fileLogConfig)) {
    fileTransport['zippedArchive'] = true;
  }

  const maxFileSize = _getLogFileMaxSize(fileLogConfig);
  if (maxFileSize) {
    fileTransport['maxSize'] = maxFileSize;
  }

  const maxFiles = _getLogFileMaxFiles(fileLogConfig);
  if (maxFiles) {
    fileTransport['maxFiles'] = maxFiles;
  }

  fileTransport.on('rotate', function (oldFilename, newFilename) {
    _logFileName = newFilename;
    // this _logger call is safe only because it happens after the logger has been initialized.
    //
    _logger.notice(`Log file rotated from ${oldFilename} to ${newFilename}`);
  });

  return fileTransport;
}

function getConsoleTransport(consoleLogConfig) {
  const consoleTransport = new winston.transports.Console({
    format: winston.format.simple()
  });

  const logLevel = getLogLevel(consoleLogConfig);
  if (logLevel) {
    consoleTransport.level = logLevel;
  }
  return consoleTransport;
}

// eslint-disable-next-line no-unused-vars
function _getLogFileName(fileLogConfig) {
  return `${packageJson.name}.log`;
}

// eslint-disable-next-line no-unused-vars
function _getRotatingLogFileName(fileLogConfig) {
  return `${packageJson.name}-%DATE%.log`;
}

// eslint-disable-next-line no-unused-vars
function _getLogFileDatePattern(fileLogConfig) {
  return 'YYYY-MM-DD';
}

function _getLogFileZippedArchive(fileLogConfig) {
  let zippedArchive = false;
  if (fileLogConfig && 'zippedArchive' in fileLogConfig) {
    zippedArchive = fileLogConfig['zippedArchive'];
  }
  return zippedArchive;
}

function _getLogFileDir(fileLogConfig) {
  return _getConfiguredLogDir(fileLogConfig);
}

function _getRotatingLogFileDir(fileLogConfig) {
  let logFileDir = _getConfiguredLogDir(fileLogConfig);
  if (!logFileDir) {
    logFileDir = _getDefaultLogDir();
  }
  return logFileDir;
}

function _getConfiguredLogDir(fileLogConfig) {
  let logFileDir;
  if (fileLogConfig && 'logDir' in fileLogConfig && fileLogConfig['logDir'].length > 0) {
    const fileLogDir = fileLogConfig['logDir'];
    const mustacheVariables = _getMustacheVariables(fileLogDir);
    if (mustacheVariables.length > 0) {
      const mustacheVariableValueMap = new Map();
      for (let mustacheVariable of mustacheVariables) {
        const value = process.env[mustacheVariable];
        if (!value) {
          throw new Error(`User settings logging.logDir value ${fileLogDir} contains ` +
            `a reference to the environment variable ${mustacheVariable} that is not set`);
        }
        mustacheVariableValueMap.set(mustacheVariable, value);
      }
      logFileDir = path.normalize(_replaceMustacheVariables(fileLogDir, mustacheVariableValueMap));
    } else {
      logFileDir = fileLogDir;
    }
    fsUtils.makeDirectoryIfNotExists(logFileDir).then();
  }
  return logFileDir;
}

function _getDefaultLogDir() {
  const logFileDir = path.normalize(path.join(_tempDir, `${packageJson.name}-logs`));
  fsUtils.makeDirectoryIfNotExists(logFileDir).then();
  return logFileDir;
}

function _getLogFileMaxSize(fileLogConfig) {
  let maxSize;
  if (fileLogConfig && 'maxSize' in fileLogConfig) {
    maxSize = fileLogConfig['maxSize'];
  }
  return maxSize;
}

function _getLogFileMaxFiles(fileLogConfig) {
  let maxFiles;
  if (fileLogConfig && 'maxFiles' in fileLogConfig) {
    maxFiles = fileLogConfig['maxFiles'];
  }
  return maxFiles;
}

function _getMustacheVariables(text) {
  const mustacheVariables = [];
  const mustacheRegex = /{{([a-zA-Z0-9\\_\\-\\.]+)}}/g;

  if (text) {
    let match = mustacheRegex.exec(text);
    while (match) {
      mustacheVariables.push(match[1]);
      match = mustacheRegex.exec(text);
    }
  }
  return mustacheVariables;
}

function _replaceMustacheVariables(text, variableValueMap) {
  let result = text;

  if (text && variableValueMap && variableValueMap.length > 0) {
    for (let [key, value] of variableValueMap) {
      result = result.replace(`{{${key}}`, value);
    }
  }
  return result;
}

function _getLevelMessage(level) {
  let message = 'not set';
  if (level) {
    message = `set to ${level}`;
  }
  return message;
}

module.exports = {
  initializeLoggingSystem,
  getLogger,
  getLogFileName,
  getDefaultLogDirectory,
  logRendererMessage
};
