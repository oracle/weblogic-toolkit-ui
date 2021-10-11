/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout'],
  function (ko) {
    function WktConsole() {
      // notify views to show the console
      this.show = ko.observable();
      this.show.extend({ notify: 'always' });

      this.lines = ko.observableArray();

      this.addLine = (line, outputType) => {
        let value = {text: line, type: outputType};
        this.lines.push(value);
      };

      this.clear = () => {
        this.lines.removeAll();
      };
    }

    // Return a singleton instance
    return new WktConsole();
  }
);
