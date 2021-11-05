/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
let promptId = null;
let promptOptions = null;

function promptError(error) {
  if (error instanceof Error) {
    error = error.message;
  }

  window.api.ipc.sendSync('prompt-error:' + promptId, error);
}

function promptCancel() {
  window.api.ipc.sendSync('prompt-post-data:' + promptId, null);
}

function promptSubmit() {
  const data = {};
  window.api.ipc.sendSync('prompt-post-data:' + promptId, data);
}

function promptRegister() {
  promptId = document.location.hash.replace('#', '');

  try {
    promptOptions = JSON.parse(window.api.ipc.sendSync('prompt-get-options:' + promptId));
  } catch (error) {
    return promptError(error);
  }

  const okButton = document.querySelector('#ok');

  okButton.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      promptCancel();
    }
  });

  document.querySelector('#form').addEventListener('submit', promptSubmit);

  okButton.focus();

  window.api.i18n.ready.then(() => {
    const versionText = window.api.i18n.t('dialog-about-version', {
      version: promptOptions.applicationVersion,
      buildVersion: promptOptions.version
    });

    document.querySelector('#title').textContent = promptOptions.applicationName;
    document.querySelector('#appName').textContent = promptOptions.applicationName;
    document.querySelector('#version').textContent = versionText;
    document.querySelector('#copyright').textContent = promptOptions.copyright;

    okButton.textContent = window.api.i18n.t('dialog-button-ok');

    const height = document.querySelector('body').offsetHeight;
    window.api.ipc.sendSync('prompt-size:' + promptId, height);
  });
}

window.addEventListener('error', error => {
  if (promptId) {
    const text = error.message ? error.message : error;
    promptError('An error has occurred on the about window: \n' + text);
  }
});

document.addEventListener('DOMContentLoaded', promptRegister);
