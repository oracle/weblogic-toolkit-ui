/**
 * @license
 * Copyright (c) 2021, 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const { app } = require('electron');
const i18n = require('./i18next.config');
const { executeScriptCommand } = require('./childProcessExecutor');
const userSettings = require('./userSettings');
const { getImagetoolShellScript } = require('./wktTools');
const { getLogger } = require('./wktLogging');
const { getErrorMessage } = require('./errorUtils');
const { getDockerEnv } = require('./imageBuilderUtils');

async function inspectImage(imageTag, options) {
  const inspectResults = {
    isSuccess: true
  };
  return new Promise(resolve => {
    callImageToolInspect(options.javaHome, imageTag, options).then(response => {
      getLogger().debug('inspectResponse is a %s and equals: %s', typeof response, response);
      try {
        inspectResults['contents'] = JSON.parse(response);
      } catch (err) {
        getLogger().error('Parsing inspectResponse as JSON failed: %s', err);
        inspectResults.isSuccess = false;
        inspectResults.reason = i18n.t('wit-inspect-inspect-parse-error-message',
          { imageTag: imageTag, error: getErrorMessage(err) });
        resolve(inspectResults);
      }
      resolve(inspectResults);
    }).catch(err => {
      inspectResults.isSuccess = false;
      inspectResults.reason = i18n.t('wit-inspect-inspect-error-message', { imageTag: imageTag, error: err });
      resolve(inspectResults);
    });
  });
}

async function callImageToolInspect(javaHome, imageTag, options) {
  const httpsProxyUrl = userSettings.getHttpsProxyUrl();
  const bypassProxyHosts = userSettings.getBypassProxyHosts();

  return new Promise((resolve, reject) => {
    const env = getInspectEnvironment(javaHome, options, httpsProxyUrl, bypassProxyHosts);
    const scriptName = getImagetoolShellScript();
    const args = getImageToolInspectArgs(imageTag, options);
    executeScriptCommand(scriptName, args, env).then(results => {
      resolve(results);
    }).catch(err => reject(err));
  });
}

function getInspectEnvironment(javaHome, options, httpsProxyUrl, bypassProxyHosts) {
  if (options && 'useProxy' in options && options.useProxy && !httpsProxyUrl) {
    throw new Error('Image tool inspection called with useProxy option but user settings has no proxy URL set.');
  }
  const env = getDockerEnv(httpsProxyUrl, bypassProxyHosts, options);
  env['JAVA_HOME'] = javaHome;
  env['WLSIMG_BLDDIR'] = app.getPath('temp');
  return env;
}

function getImageToolInspectArgs(imageTag, options) {
  const args = [ 'inspect', `--image=${imageTag}`, '--patches', '--format=JSON' ];
  if ('imageBuilderExe' in options && options.imageBuilderExe) {
    args.push(`--builder=${options['imageBuilderExe']}`);
  }
  if ('architecture' in options && options.architecture) {
    const platform = 'linux/' + options.architecture;
    args.push(`--platform=${platform}`);
  }
  return args;
}

module.exports = {
  inspectImage
};
