'use strict';

try {
  const textDiff  = require('diff');
  const jsonDiff  = require('jsondiffpatch').create();
  const deepClone = require('clone-deep');

  function stripAdditions(changeset, inArray) {
    if (Array.isArray(changeset)) {
      return !inArray && changeset.length === 1;// property was added
    }

    // No need strip elements in the arrays because in arrays sequence is important
    const isArray = changeset._t === 'a';
    let hasChange = false;
    for (const prop of Object.keys(changeset)) {
      if (prop === '_t') continue;

      // Drop empty changesets
      if (stripAdditions(changeset[prop], isArray)) {
        delete changeset[prop];
        continue;
      }
      hasChange = true;
    }
    return !hasChange;
  }

  function stringify(value) {
    if (typeof value === 'string') {
      return value;
    }
    // JSON.stringify(undefined) === undefined, so handle this special case
    if (typeof value === 'undefined') {
      return 'undefined';
    }
    return JSON.stringify(value, null, 2).replace(/,(\n|$)/g, '$1');
  }

  function makeDiff(expected, actual) {
    const diff = jsonDiff.diff(expected, actual);
    stripAdditions(diff, false);
    let patched = jsonDiff.patch(deepClone(expected), diff);

    expected = stringify(expected);
    patched  = stringify(patched);

    return {
      unified: textDiff.structuredPatch(null, null, expected, patched),
      inline:  textDiff.diffWordsWithSpace(expected, patched),
    };
  }

  module.exports = makeDiff;
} catch (e) {
  // istanbul ignore next
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }
  // istanbul ignore next
  module.exports = null;
}