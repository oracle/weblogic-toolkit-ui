/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

const i18n = require('./i18next.config');
const { executeScriptCommand } = require('./childProcessExecutor');
const userSettings = require('./userSettings');
const { getImagetoolShellScript } = require('./wktTools');
const { getLogger } = require('./wktLogging');
const { getErrorMessage } = require('./errorUtils');

async function inspectImage(imageTag, options) {
  const inspectResults = {
    isSuccess: true
  };
  return new Promise(resolve => {
    callImageToolInspect(options.javaHome, imageTag, { buildEngine: options.imageBuilder }).then(response => {
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
  const httpsProxyUrl = await userSettings.getHttpsProxyUrl();
  const bypassProxyHosts = await userSettings.getBypassProxyHosts();

  return new Promise((resolve, reject) => {
    const env = { JAVA_HOME: javaHome };
    getProxyEnvironment(env, options, httpsProxyUrl, bypassProxyHosts);

    const scriptName = getImagetoolShellScript();
    const args = getImageToolInspectArgs(imageTag, options);
    executeScriptCommand(scriptName, args, env).then(results => {
      resolve(results);
    }).catch(err => reject(err));
  });
}

function getProxyEnvironment(env, options, httpsProxyUrl, bypassProxyHosts) {
  if (options && 'useProxy' in options && options.useProxy) {
    if (httpsProxyUrl) {
      env['HTTPS_PROXY'] = httpsProxyUrl;
    } else {
      throw new Error('Image tool inspection called with useProxy option but user settings has no proxy URL set.');
    }

    if (bypassProxyHosts) {
      env['NO_POXY'] = bypassProxyHosts;
    }
  }
}

function getImageToolInspectArgs(imageTag, options) {
  const args = [ 'inspect', `--image=${imageTag}`, '--format=JSON' ];
  if ('buildEngine' in options && options.buildEngine) {
    args.push(`--builder=${options['buildEngine']}`);
  }
  return args;
}

module.exports = {
  inspectImage
};
