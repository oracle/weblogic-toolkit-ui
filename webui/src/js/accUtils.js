/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define([],
  function () {
    /**
     * Method for sending notifications to the aria-live region for Accessibility.
     * Sending a notice when the page is loaded, as well as changing the page title
     * is considered best practice for making Single Page Applications Accessible.
     */
    const validAriaLiveValues = ['off', 'polite', 'assertive'];
    let announce = function (message, manner) {

      if (manner === undefined || !validAriaLiveValues.includes(manner)) {
        manner = 'polite';
      }

      let params = {
        'bubbles': true,
        'detail': { 'message': message, 'manner': manner }
      };
      document.getElementById('globalBody').dispatchEvent(new CustomEvent('announce', params));
    };

    return { announce: announce };
  }
);
