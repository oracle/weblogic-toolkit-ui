/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
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
  const dataElement = document.querySelector('#data');
  const data = dataElement.value;
  window.api.ipc.sendSync('prompt-post-data:' + promptId, data);
}

function promptForgotPassphrase() {
  const confirm = window.api.ipc.sendSync('prompt-forgot:' + promptId);
  if(confirm) {
    window.api.ipc.sendSync('prompt-post-data:' + promptId, -1);
  }
  return false;  // don't follow href link
}

function promptRegister() {
  promptId = document.location.hash.replace('#', '');

  try {
    promptOptions = JSON.parse(window.api.ipc.sendSync('prompt-get-options:' + promptId));
  } catch (error) {
    return promptError(error);
  }

  document.querySelector('#form').addEventListener('submit', promptSubmit);
  document.querySelector('#cancel').addEventListener('click', promptCancel);
  document.querySelector('#forgot').addEventListener('click', promptForgotPassphrase);

  // hide the "forgot passphrase" link if not applicable
  document.querySelector('#forgot').hidden = !window.api.credentialPassphrase.allowReset;

  const dataElement = document.querySelector('#data');
  dataElement.value = promptOptions.value ? promptOptions.value : '';

  dataElement.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      promptCancel();
    }
  });

  dataElement.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.querySelector('#ok').click();
    }
  });

  dataElement.focus();
  dataElement.select();

  window.api.i18n.ready.then(() => {
    document.querySelector('#ok').textContent = window.api.i18n.t('dialog-button-ok');
    document.querySelector('#cancel').textContent = window.api.i18n.t('dialog-button-cancel');
    document.querySelector('#label').textContent = window.api.i18n.t('dialog-passphrase-prompt-label');
    document.querySelector('#title').textContent = window.api.i18n.t('dialog-passphrase-prompt-title');
    document.querySelector('#forgot').textContent = window.api.i18n.t('dialog-passphrase-prompt-forgot-passphrase');

    const height = document.querySelector('body').offsetHeight;
    window.api.ipc.sendSync('prompt-size:' + promptId, height);
  });
}

window.addEventListener('error', error => {
  if (promptId) {
    const text = error.message ? error.message : error;
    promptError('An error has occurred on the prompt window: \n' + JSON.stringify(text));
  }
});

document.addEventListener('DOMContentLoaded', promptRegister);
