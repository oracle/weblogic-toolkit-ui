/**
 * @license
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const { exec, execFile, spawn } = require('child_process');
const { getLogger } = require('./wktLogging');
const { sendToWindow } = require('./windowUtils');

async function executeChildShellScript(currentWindow, scriptName, argList, env, stdoutEventName, {
  stderrEventName = stdoutEventName,
  shell = true,
  detached = false,
  windowsHide = true
} = {}) {

  return executeChildProcess(currentWindow, scriptName, argList, env, stdoutEventName, {
    stderrEventName: stderrEventName,
    shell: shell,
    detached: detached,
    windowsHide: windowsHide
  });
}

async function executeChildProcess(currentWindow, executable, argList, env, stdoutEventName, {
  stderrEventName = stdoutEventName,
  shell = false,
  detached = false,
  windowsHide = true
} = {}) {

  const command = workaroundNodeJsIssue38490(shell, executable, argList);
  const options = getSpawnOptions(env, shell, detached, windowsHide);
  const child = spawn(command.executable, command.argList, options);

  await Promise.all( [
    streamChildOutput(currentWindow, child.stdout, stdoutEventName),
    streamChildOutput(currentWindow, child.stderr, stderrEventName)
  ]);

  await onExit(child)
    .then(() => sendToWindow(currentWindow, stdoutEventName, `${executable} exited with exit code 0`))
    .catch((err) => sendToWindow(currentWindow, stderrEventName, `${executable} failed: ${err.toString()}`));

  return child.exitCode;
}

function spawnDaemonChildProcess(executable, argList, env, extraOptions = {}, {
  shell = false,
  detached = false,
  windowHime: windowHide = true,
} = {}) {
  const command = workaroundNodeJsIssue38490(shell, executable, argList);
  const options = getSpawnOptions(env, shell, detached, windowHide, extraOptions);

  getLogger().debug('Spawning daemon process %s with arguments %s and options %s',
    command.executable, command.argList, JSON.stringify(options));
  return spawn(command.executable, command.argList, options);
}

function getSpawnOptions(env, shell, detached, windowsHide, extraOptions = {}) {
  const options = {
    stdio: [ 'pipe', 'pipe', 'pipe' ],
    shell: shell,
    detached: detached,
    windowsHide: windowsHide
  };

  if (envIsNotEmpty(env)) {
    options['env'] = env;
  }

  for (const [key, value] of Object.entries(extraOptions)) {
    options[key] = value;
  }
  return options;
}

function envIsNotEmpty(envObj) {
  let result = false;
  if (envObj) {
    for (const prop in envObj) {
      if (Object.prototype.hasOwnProperty.call(envObj, prop)) {
        result = true;
        break;
      }
    }
  }
  return result;
}

async function streamChildOutput(currentWindow, outputStream, eventName) {
  for await (const line of chunksToLinesAsync(outputStream)) {
    sendToWindow(currentWindow, eventName, chomp(line));
  }
}

async function executeFileCommand(fileName, args, env, containsCredentials) {
  return new Promise((resolve, reject) => {
    if (!containsCredentials) {
      getLogger().debug('Executing %s with arguments %s and environment %s', fileName, args, env ? JSON.stringify(env) : '<none>');
    }
    const options = { windowsHide: true };
    if (env) {
      options['env'] = env;
    }

    execFile(fileName, args, options, (err, stdout, stderr) => execCallback(fileName, resolve, reject, err, stdout, stderr));
  });
}

async function executeScriptCommand(fileName, args, env) {
  return new Promise((resolve, reject) => {
    const options = { windowsHide: true };
    if (env) {
      options['env'] = env;
    }

    const command = formatScriptCommand(fileName, args);
    getLogger().debug('Executing %s with environment variables %s', command, JSON.stringify(env));
    exec(command, options, (err, stdout, stderr) => execCallback(fileName, resolve, reject, err, stdout, stderr));
  });
}

function execCallback(fileName, resolve, reject, err, stdout, stderr) {
  if (err) {
    reject(err);
  }
  getLogger().debug('%s returned stdout: %s', fileName, stdout ? stdout.trim() : '');
  getLogger().debug('%s returned stderr: %s', fileName, stderr ? stderr.trim() : '');
  resolve(stdout);
}

function workaroundNodeJsIssue38490(shell, executable, argList) {
  const result = { executable: executable, argList: argList};

  if (shell) {
    result['executable'] = quoteWhitespace(executable);
    if (argList && Array.isArray(argList) && argList.length > 0) {
      const newArgList = [];
      for (const arg of argList) {
        newArgList.push(quoteWhitespace(arg));
      }
      result['argList'] = newArgList;
    } else {
      result['argList'] = argList;
    }
  }
  return result;
}

function formatScriptCommand(scriptFileName, args) {
  let command = quoteWhitespace(scriptFileName);
  if (args && args.length > 0) {
    for (const arg of args) {
      command += ` ${quoteWhitespace(arg)}`;
    }
  }
  return command;
}


function quoteWhitespace(str) {
  if (str && /\s/g.test(str)) {
    return `"${str}"`;
  }
  return str;
}

//////////////////////////////////////////////////////////////////////////////////////
// The next 3 functions were adapted from the @rauschma/stringio package,
// licensed under the MIT license.
//
// See the THIRD_PARTY_LICENSES.txt file for the license restrictions and copyright.
//
function chomp(line) {
  const match = /\r?\n$/u.exec(line);
  if (! match) return line;
  return line.slice(0, match.index);
}

async function* chunksToLinesAsync(chunks) {
  let previous = '';
  for await (const chunk of chunks) {
    previous += chunk;
    let eolIndex;
    while ((eolIndex = previous.indexOf('\n')) >= 0) {
      // line includes the EOL
      const line = previous.slice(0, eolIndex+1);
      yield line;
      previous = previous.slice(eolIndex+1);
    }
  }
  if (previous.length > 0) {
    yield previous;
  }
}

function onExit(childProcess) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-unused-vars
    childProcess.once('exit', (code, signal) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error('Exit with error code: '+code));
      }
    });
    childProcess.once('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  executeChildProcess,
  executeChildShellScript,
  executeFileCommand,
  executeScriptCommand,
  spawnDaemonChildProcess
};
