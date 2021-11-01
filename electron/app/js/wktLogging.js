const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const packageJson = require('../../package.json');
const {getLoggingConfiguration} = require('./userSettings');
const fsUtils = require('./fsUtils');

let _logger;
let _logFileName;
let _wktMode;
// eslint-disable-next-line no-unused-vars
let _wktApp;
let _tempDir;

/* global process */
function initializeLoggingSystem(wktMode, wktApp, tempDir) {
  if (_logger) {
    return _logger;
  }

  _wktMode = wktMode;
  _wktApp = wktApp;
  _tempDir = tempDir;
  const devMode = _wktMode.isDevelopmentMode();
  const logConfig = getLoggingConfiguration();
  const transports = getTransports(logConfig, devMode);
  const baseLogger = _getBaseLogger(devMode, logConfig, transports);
  writeInitialLogEntries(baseLogger, wktApp, transports);
  _logger = baseLogger;
  return _logger;
}

function getLogger() {
  if (!_logger) {
    throw new Error('getLogger() cannot be called until initializeLoggingSystem() has been called');
  }
  return _logger;
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

function _getBaseLogger(devMode, logConfig, transports) {
  const logLevel = getLogLevel(logConfig);
  if (!transports) {
    transports = getTransports(logConfig, devMode);
  }

  return winston.createLogger({
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

  baseLogger.debug('Logging system initialization complete');
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
