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
  let data = null;

  if(promptOptions.fields) {
    data = {};
    promptOptions.fields.forEach(field => {
      const inputElement = document.getElementById(field.id);
      data[field.id] = inputElement.value;
    });

  } else {
    const dataElement = document.querySelector('#data');

    if (promptOptions.type === 'input') {
      data = dataElement.value;
    } else if (promptOptions.type === 'select') {
      if (promptOptions.selectMultiple) {
        data = dataElement.querySelectorAll('option[selected]').map(o => o.getAttribute('value'));
      } else {
        data = dataElement.value;
      }
    }
  }

  window.api.ipc.sendSync('prompt-post-data:' + promptId, data);
}

function promptCreateInput(promptOptions) {
  const dataElement = document.createElement('input');
  dataElement.setAttribute('type', 'text');

  if (promptOptions.value) {
    dataElement.value = promptOptions.value;
  } else {
    dataElement.value = '';
  }

  if (promptOptions.inputAttrs && typeof (promptOptions.inputAttrs) === 'object') {
    for (const k in promptOptions.inputAttrs) {
      if (!Object.prototype.hasOwnProperty.call(promptOptions.inputAttrs, k)) {
        continue;
      }

      dataElement.setAttribute(k, promptOptions.inputAttrs[k]);
    }
  }

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

  return dataElement;
}

function promptCreateSelect() {
  const dataElement = document.createElement('select');
  let optionElement;

  for (const k in promptOptions.selectOptions) {
    if (!Object.prototype.hasOwnProperty.call(promptOptions.selectOptions, k)) {
      continue;
    }

    optionElement = document.createElement('option');
    optionElement.setAttribute('value', k);
    optionElement.textContent = promptOptions.selectOptions[k];
    if (k === promptOptions.value) {
      optionElement.setAttribute('selected', 'selected');
    }

    dataElement.append(optionElement);
  }

  return dataElement;
}

function promptRegister() {
  promptId = document.location.hash.replace('#', '');

  try {
    promptOptions = JSON.parse(window.api.ipc.sendSync('prompt-get-options:' + promptId));
  } catch (error) {
    return promptError(error);
  }

  const labelContainer = document.querySelector('#label');
  if (labelContainer) {
    if (promptOptions.useHtmlLabel) {
      labelContainer.innerHTML = promptOptions.label;
    } else {
      labelContainer.textContent = promptOptions.label;
    }
  }

  if (promptOptions.buttonLabels && promptOptions.buttonLabels.ok) {
    document.querySelector('#ok').textContent = promptOptions.buttonLabels.ok;
  }

  if (promptOptions.buttonLabels && promptOptions.buttonLabels.cancel) {
    document.querySelector('#cancel').textContent = promptOptions.buttonLabels.cancel;
  }

  document.querySelector('#form').addEventListener('submit', promptSubmit);
  document.querySelector('#cancel').addEventListener('click', promptCancel);

  if (promptOptions.fields) {
    const formElement = document.querySelector('#form');
    const buttonContainer = document.querySelector('#buttons');

    promptOptions.fields.forEach(field => {
      if(field.label) {
        const labelContainer = document.createElement('div');
        labelContainer.setAttribute('class', 'label');
        labelContainer.innerHTML = field.label;
        formElement.insertBefore(labelContainer, buttonContainer);
      }

      const dataElement = createDataElement(field);
      if(dataElement) {
        dataElement.setAttribute('id', field.id);
        dataElement.setAttribute('class', 'data');
        const dataContainer = document.createElement('div');
        dataContainer.setAttribute('class', 'data-container');
        dataContainer.append(dataElement);
        formElement.insertBefore(dataContainer, buttonContainer);
      }
    });

  } else {
    const dataContainerElement = document.querySelector('#data-container');

    const dataElement = createDataElement(promptOptions);
    if(!dataElement) {
      return promptError(`Unhandled input type '${promptOptions.type}'`);
    }

    dataContainerElement.append(dataElement);
    dataElement.setAttribute('id', 'data');

    dataElement.focus();
    if (promptOptions.type === 'input') {
      dataElement.select();
    }
  }

  const height = document.querySelector('body').offsetHeight;
  window.api.ipc.sendSync('prompt-size:' + promptId, height);
}

function createDataElement(promptOptions) {
  let dataElement;
  if (promptOptions.type === 'input') {
    dataElement = promptCreateInput(promptOptions);
  } else if (promptOptions.type === 'select') {
    dataElement = promptCreateSelect();
  } else {
    dataElement = null;
  }
  return dataElement;
}

window.addEventListener('error', error => {
  if (promptId) {
    promptError('An error has occurred on the prompt window: \n' + error);
  }
});

document.addEventListener('DOMContentLoaded', promptRegister);
