/**
 * @license
 * Copyright (c) 2025, 2026, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fsPromises = require('node:fs/promises');
const path = require('node:path');

const  ModelArchivePlugin = require('./modelArchivePlugin');
const childProcessExecutor = require('./childProcessExecutor');
const fsUtils = require('./fsUtils');
const { getArchiveHelperShellScript, isWdtErrorExitCode} = require('./wktTools');
const i18n = require('./i18next.config');
const { getErrorMessage } = require('./errorUtils');

const WKT_CONSOLE_STDOUT_CHANNEL = 'show-console-out-line';
const WKT_CONSOLE_STDERR_CHANNEL = 'show-console-err-line';

class WdtArchiveHelperPlugin extends ModelArchivePlugin {
  constructor(logger, options) {
    super('java');
    super.modelArchivePlugin = this;
    this.logger = logger;
    this.currentWindow = options.currentWindow;
    this.projectDirectory = options.projectDirectory;
    this.javaHome = options.javaHome;
  }

  get archivePluginType() {
    return super.archivePluginType;
  }

  async saveContentsOfArchiveFiles(archiveUpdates, getCollapsedOperationFunction) {
    const archiveFilesContents = { };
    for (const [archiveFileName, userOperations ] of Object.entries(archiveUpdates)) {
      const archiveFile = fsUtils.getAbsolutePath(archiveFileName, this.projectDirectory);
      const operations = getCollapsedOperationFunction(userOperations);

      if (operations.length > 0) {
        try {
          archiveFilesContents[archiveFileName] = await this.saveZipEntries(archiveFile, operations);
        } catch (err) {
          return Promise.reject(new Error(i18n.t('model-archive-java-save-archive-file-failed-error-message',
            { archiveFile: archiveFile, error: getErrorMessage(err) })));
        }
      }
    }
    return Promise.resolve(archiveFilesContents);
  };

  async saveZipEntries(archiveFile, operations) {
    const archiveFileDirectory = await fsUtils.getDirectoryForPath(archiveFile) || this.projectDirectory;
    const inputFileName = fsUtils.getTemporaryFileName('input_json_file.json', '.json');
    const outputFileName = fsUtils.getTemporaryFileName('output_json_file.json', '.json');
    const inputFile = path.normalize(path.join(archiveFileDirectory, inputFileName));
    const outputFile = path.normalize(path.join(archiveFileDirectory, outputFileName));

    const operationsJsonString =
      JSON.stringify(JSON.parse(`{ "operations": ${JSON.stringify(operations)} }`), null, 2);
    try {
      await fsPromises.writeFile(inputFile, operationsJsonString);
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-java-write-input-file-failed-error-message',
        { inputFile: inputFile, error: getErrorMessage(err) })));
    }

    const argList = [
      'wktui',
      'update',
      '-archive_file',
      archiveFile,
      '-input_json_file',
      inputFile,
      '-output_json_file',
      outputFile,
    ];

    const env = {
      JAVA_HOME: this.javaHome
    };

    const options = {
      stderrEventName: WKT_CONSOLE_STDERR_CHANNEL
    };

    if (this.logger.isDebugEnabled()) {
      this.logger.debug(`Invoking ${getArchiveHelperShellScript()} with args ${JSON.stringify(argList)} and environment ${JSON.stringify(env)}`);
    }

    try {
      const exitCode = await childProcessExecutor.executeChildShellScript(this.currentWindow,
        getArchiveHelperShellScript(), argList, env, WKT_CONSOLE_STDOUT_CHANNEL, options);
      if (isWdtErrorExitCode(exitCode)) {
        return Promise.reject(new Error(i18n.t('model-archive-java-error-exit-code-error-message', { exitCode: exitCode })));
      }
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-java-execution-failed-error-message', { error: getErrorMessage(err) })));
    } finally {
      await fsPromises.rm(inputFile, { force: true });
    }

    let results;
    try {
      const rawOutput = await this._getOutputFileResults(outputFile);
      results = this._getArchiveEntries(rawOutput);
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-java-update-get-output-failed-error-message',
        { outputFile: outputFile, error: getErrorMessage(err) })));
    } finally {
      await fsPromises.rm(outputFile, { force: true });
    }
    return Promise.resolve(results);
  };

  async _getZipEntries(archiveFile) {
    const archiveFileDirectory = await fsUtils.getDirectoryForPath(archiveFile) || this.projectDirectory;
    const outputFileName = fsUtils.getTemporaryFileName('output_json_file.json', '.json');
    const outputFile = path.normalize(path.join(archiveFileDirectory, outputFileName));

    const argList = [
      'wktui',
      'list',
      '-archive_file',
      archiveFile,
      '-output_json_file',
      outputFile,
    ];

    const env = {
      JAVA_HOME: this.javaHome
    };

    const options = {
      stderrEventName: WKT_CONSOLE_STDERR_CHANNEL
    };

    if (this.logger.isDebugEnabled()) {
      this.logger.debug(`Invoking ${getArchiveHelperShellScript()} with args ${JSON.stringify(argList)} and environment ${JSON.stringify(env)}`);
    }

    try {
      const exitCode = await childProcessExecutor.executeChildShellScript(this.currentWindow,
        getArchiveHelperShellScript(), argList, env, WKT_CONSOLE_STDOUT_CHANNEL, options);
      if (isWdtErrorExitCode(exitCode)) {
        return Promise.reject(new Error(i18n.t('model-archive-java-error-exit-code-error-message', { exitCode: exitCode })));
      }
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-java-execution-failed-error-message', { error: getErrorMessage(err) })));
    }

    let results = undefined;
    try {
      results = await this._getOutputFileResults(outputFile);
    } catch (err) {
      return Promise.reject(new Error(i18n.t('model-archive-java-list-get-output-failed-error-message',
        { archiveFile: archiveFile, outputFile: outputFile, error: getErrorMessage(err)})));
    } finally {
      await fsPromises.rm(outputFile, { force: true });
    }
    return Promise.resolve(results);
  }

  async _getOutputFileResults(outputFile) {
    let results = { };
    if (await fsUtils.exists(outputFile)) {
      const outputJsonString = await fsPromises.readFile(outputFile, { encoding: 'utf8' });
      results = JSON.parse(outputJsonString);
    }
    return results;
  }
}

module.exports = {
  WdtArchiveHelperPlugin
};
