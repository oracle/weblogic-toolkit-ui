/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'utils/i18n'],
  function(accUtils, i18n) {
    function ModelDesignViewModel() {

      this.connected = () => {
        accUtils.announce('Model design view loaded.', 'assertive');
        // Implement further logic if needed
      };

      this.labelMapper = (labelId, payload) => {
        return i18n.t(`model-design-${labelId}`, payload);
      };

    }

    /*
     * Returns a constructor for the ViewModel.
     */
    return ModelDesignViewModel;
  }
);
