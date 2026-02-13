/**
 * @license
 * Copyright (c) 2021, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'js-yaml', 'utils/i18n', 'models/wkt-project', 'utils/view-helper', 'ojs/ojinputtext',
  'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, jsyaml, i18n, project, ViewHelper) {
  function DomainStatusDialogModel(args) {
    const DIALOG_SELECTOR = '#domainStatusDialog';

    this.project = project;
    this.domainStatus = args.domainStatus;
    this.domainOverallStatus = args.domainOverallStatus;

    this.domainMessage = this.domainStatus.message;

    this.connected = () => {
      accUtils.announce('Show domain status dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog after the current thread, which is loading this view model.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      ViewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.themeClasses = ViewHelper.themeClasses;

    this.labelMapper = (labelId) => {
      return i18n.t(`domain-design-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      return i18n.t(labelId, arg);
    };

    this.okInput = () => {
      this.dialogContainer.close();
    };

    this.makeYamlOutput = (data) => {
      let result = '';
      if (typeof data !== 'undefined') {
        result = data.map(item => { return jsyaml.dump(item); }).join('\n');
      }
      return result;
    };

    this.domainConditions = '';
    this.domainClusterStatus = '';
    this.domainServerStatus = '';
    this.introspectJobFailureCount = 0;
    this.domainHasError = false;
    this.isOperatorVersion4orHigher = false;

    if (!project.wko.installedVersion.hasValue() ||
        window.api.utils.compareVersions(project.wko.installedVersion.value, '4.0.0') >= 0) {
      this.isOperatorVersion4orHigher = true;
    }

    if ('status' in this.domainStatus && 'conditions' in this.domainStatus.status) {
      this.domainConditions = this.makeYamlOutput(this.domainStatus.status.conditions);
      this.domainClusterStatus = this.makeYamlOutput(this.domainStatus.status.clusters);
      this.domainServerStatus = this.makeYamlOutput(this.domainStatus.status.servers);
      this.domainName = this.domainStatus.spec.domainUID;
      if (this.isOperatorVersion4orHigher) {
        // 4.0 higher is not named introspectJobFailureCount but observeredGeneation in the status
        // text in the diaglog have been changed to Observed Generation to match, this is just a holder of the value
        this.introspectJobFailureCount = this.domainStatus.status.observedGeneration;
      } else {
        this.introspectJobFailureCount = this.domainStatus.status.introspectJobFailureCount;
      }

      const conditions = this.domainStatus.status.conditions;
      conditions.sort((a, b) => {
        if ( a.lastTransitionTime < b.lastTransitionTime ){
          return 1;
        }
        if ( a.lastTransitionTime > b.lastTransitionTime){
          return -1;
        }
        return 0;
      });

      for (const condition of conditions) {
        if (condition.type === 'Failed' && typeof condition.message !== 'undefined') {
          this.domainErrorMessage = condition.message;
          this.domainHasError = true;
          break;
        }
      }
    }

  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return DomainStatusDialogModel;
});
