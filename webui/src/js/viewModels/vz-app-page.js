/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['accUtils', 'utils/i18n'],
  function(accUtils, i18n) {
    function VzAppPageModel() {

      this.connected = () => {
        accUtils.announce('Verrazzano application view loaded.', 'assertive');
      };

      this.labelMapper = (labelId) => {
        return i18n.t(`vz-application-${labelId}`);
      };
    }

    /*
     * Returns a constructor for the ViewModel.
     */
    return VzAppPageModel;
  }
);
