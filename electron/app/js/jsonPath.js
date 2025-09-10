/**
 * @license
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
function getJsonPathReference(jsonPath, jsonObject) {
  let objectReference = jsonObject;
  let fieldName;
  if (jsonPath) {
    const fields = jsonPath.split('.');
    fieldName = fields.pop();

    for (const field of fields) {
      objectReference = traverseField(objectReference, field);
      if (!objectReference) {
        break;
      }
    }

    if (objectReference && (fieldName.includes('[') || fieldName.includes(']'))) {
      const lastArrayReferenceIndex = fieldName.lastIndexOf('[');
      const traversalFieldName = fieldName.slice(0, lastArrayReferenceIndex);
      objectReference = traverseField(objectReference, traversalFieldName);
      fieldName = normalizeArrayIndex(fieldName.slice(lastArrayReferenceIndex + 1, -1));
    }
  }
  return {reference: objectReference, field: fieldName};
}

function traverseField(reference, fieldText) {
  const fieldParts = fieldText.split('[');
  let newReference = getNewReference(reference, fieldParts[0]);

  fieldParts.shift();
  for (const arrayPart of fieldParts) {
    const arrayIndexString = arrayPart.slice(0, -1);
    if (/^\d+$/.test(arrayIndexString)) {
      const arrayIndex = parseInt(arrayIndexString);
      newReference = getNewReference(newReference, arrayIndex);
    } else if (/^'.+'$/.test(arrayIndexString)) {
      newReference = getNewReference(newReference, arrayIndexString.slice(1,-1));
    } else {
      newReference = getNewReference(newReference, arrayIndexString);
    }
  }
  return newReference;
}

// Create the new reference in the object if it does not yet exist.
//
function getNewReference(reference, field) {
  if (!reference[field]) {
    reference[field] = {};
  }
  return reference[field];
}

function normalizeArrayIndex(arrayIndexString) {
  let normalizedArrayIndex;
  if (/^\d+$/.test(arrayIndexString)) {
    normalizedArrayIndex = parseInt(arrayIndexString);
  } else if (/^['"].+['"]$/.test(arrayIndexString)) {
    normalizedArrayIndex = arrayIndexString.slice(1,-1);
  } else {
    normalizedArrayIndex = arrayIndexString;
  }
  return normalizedArrayIndex;
}

module.exports = {
  getJsonPathReference
};
